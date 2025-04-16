import Beam         from './beam.js'
import Block        from './block.js'
import Camera       from './camera.js'
import Color        from './color.js'
import Connection   from './connection.js'
import Creeper      from './creeper.js'
import Debris       from './debris.js'
import Decoration   from './decoration.js'
import Droplet      from './droplet.js'
import Images       from './images.js'
import LevelData    from './level_data.js'
import Message from './message.js'
import Mover        from './mover.js'
import RNG          from './rng.js'
import Sounds       from './sounds.js'
import Spark        from './spark.js'
import Splash       from './splash.js'
import Splatter     from './splatter.js'
import Torch        from './torch.js'
import Walker       from './walker.js'

class UndoData {
    public level:       Level
    public deaths:      number
    public frame:       number
    public walkers:     Set<Walker>     = new Set()
    public creepers:    Set<Creeper>    = new Set()
    public splatters:   Set<Splatter>   = new Set()
    public debris:      Set<Debris>     = new Set()
    public sparks:      Set<Spark>      = new Set()
    public splashes:    Set<Splash>     = new Set()
    public droplets:    Set<Droplet>    = new Set()
    public blocks:      Block[]

    constructor(level: Level) {
        this.level      = level

        this.frame      = level.frame
        this.deaths     = level.deaths

        for (const walker of level.walkers) {
            this.walkers.add(walker.clone())
        }
        for (const creeper of level.creepers) {
            this.creepers.add(creeper.clone())
        }
        for (const splatter of level.splatters) {
            this.splatters.add(splatter.clone())
        }
        for (const debris of level.debris) {
            this.debris.add(debris.clone())
        }
        for (const spark of level.sparks) {
            this.sparks.add(spark.clone())
        }
        for (const splash of level.splashes) {
            this.splashes.add(splash.clone())
        }
        for (const droplet of level.droplets) {
            this.droplets.add(droplet.clone())
        }
        this.blocks = new Array<Block>(level.blocks.length)
        for (let i = 0; i < level.blocks.length; i++) {
            this.blocks[i] = level.blocks[i].clone()
        }
    }

    undo() {
        this.level.blocks       = this.blocks
        this.level.walkers      = this.walkers
        this.level.creepers     = this.creepers
        this.level.splatters    = this.splatters
        this.level.debris       = this.debris
        this.level.sparks       = this.sparks
        this.level.splashes     = this.splashes
        this.level.droplets     = this.droplets
        this.level.deaths       = this.deaths
        this.level.frame        = this.frame

        for (let i = 0; i < Level.GridWidth * Level.GridHeight; i++) {
            this.level.indexGrid[i] = Level.GridEmpty
        }
        for (let i = 0; i < this.level.blocks.length; i++) {
            const block = this.level.blocks[i]
            this.level.setIndices(block.x, block.y, Block.Width, Block.Height, i)
        }
    }
}

export default class Level {
    static readonly Tau                     = Math.PI * 2
    static readonly GridEmpty               = 0xffff
    static readonly GridWidth               = 640
    static readonly GridHeight              = 360
    static readonly GridCenterX             = Level.GridWidth / 2
    static readonly GridCenterY             = Level.GridHeight / 2
    static readonly BrickWidth              = 40
    static readonly BrickHeight             = 30
    static readonly CellCountX              = Level.GridWidth  / Block.Width
    static readonly CellCountY              = Level.GridHeight / Block.Height
    static readonly MaxImmobilityVelocity   = 0.5
    static readonly BlockElasticity         = 0.3
    static readonly MoverElasticity         = 0.2
    static readonly InfiniteMass            = Number.MAX_SAFE_INTEGER
    static readonly ShakeMultiplier         = 0.0005

    public levelData:           LevelData
    public camera:              Camera

    public torches:             Torch[]             = []
    public decorations:         Decoration[]        = []

    public groups:              number[][]          = []    // What blocks are in each group?
    public groupIndex:          number[]            = []    // Which group does a block belong to? (indexed)
    public groupContactsAbove:  number[][]          = []
    public groupContactsBelow:  number[][]          = []
    public groupFixedUp:        boolean[]           = []
    public groupFixedDown:      boolean[]           = []
    public hoverGroup:          Set<number>         = new Set()    // What blocks are in the hover group?
    public message:             Message

    public blocks:              Block[]             = []
    public walkers:             Set<Walker>         = new Set()
    public creepers:            Set<Creeper>        = new Set()
    public splatters:           Set<Splatter>       = new Set()
    public debris:              Set<Debris>         = new Set()
    public sparks:              Set<Spark>          = new Set()
    public splashes:            Set<Splash>         = new Set()
    public droplets:            Set<Droplet>        = new Set()
    public indexGrid:           Uint16Array         = new Uint16Array(Level.GridWidth * Level.GridWidth).fill(Level.GridEmpty)
    public deaths:              number              = 0
    public frame:               number              = 0

    public undoStack:           UndoData[]          = []

// #         #####      #     ######   
// #        #     #    # #    #     #  
// #        #     #   #   #   #     #  
// #        #     #  #######  #     #  
// #        #     #  #     #  #     #  
// #        #     #  #     #  #     #  
// #######   #####   #     #  ######   

    constructor(levelData: LevelData, camera: Camera) {
        this.levelData              = levelData
        this.camera                 = camera
        this.message                = new Message(this.levelData.title)
        this.load()
    }
    load() {
        const typeGrid                      = this.levelData.typeGrid
        const attributeGrid                 = this.levelData.attributeGrid
        const rowCount                      = typeGrid.length
        const colCount                      = typeGrid[0].length
        const flippedTypeGrid: string[]     = flippedGrid(typeGrid)
        const blockGrid: Block[][]          = Array.from({ length: Level.CellCountX }, () => new Array(Level.CellCountY).fill(null))

        // Flip type grid
        function flippedGrid(grid: string[]) {
            const newGrid: string[] = Array.from({ length: grid[0].length }, () => '')
            for (let i = 0; i < colCount; i++) {
                for (let j = 0; j < rowCount; j++) {
                    newGrid[i] += grid[j][i]
                }
            }
            return newGrid
        }


        // Initial block types
        for (let i = 0; i < Level.CellCountX; i++) {
            const cellX = i * 2
            for (let j = 0; j < Level.CellCountY; j++) {
                const cellY     = j * 2
                const char      = flippedTypeGrid[cellX][cellY]
                const type      = Block.CharToType[char]
                if (type === Block.None) continue

                const x         = i * Block.Width
                const y         = j * Block.Height
                const block     = new Block(x, y, type)
                blockGrid[i][j] = block
            }
        }

        // Add messages
        for (const message of this.levelData.messages) {
            const text              = message[0]
            const x                 = message[1]
            const y                 = message[2]
            blockGrid[x][y].message = text
        }

        // Set char attributes
        for (let i = 0; i < Level.CellCountY; i++) {
            const row       = i * 2
            const line      = attributeGrid[row]
            const tokens    = line.split(' ')
            for (let j = 0; j < Level.CellCountX; j++) {
                if (blockGrid[j][i] === null) continue

                const token = tokens[j]
                for (const char of token) {
                    blockGrid[j][i].setAttribute(char)
                }
            }
        }

        // Horizontal connections
        for (let i = 0; i < Level.CellCountX - 1; i++) {
            const cellX = i * 2 + 1
            for (let j = 0; j < Level.CellCountY; j++) {
                const cellY = j * 2
                const type  = Connection.CharToConnection[flippedTypeGrid[cellX][cellY]]
                const self  = blockGrid[i][j]
                const east  = blockGrid[i + 1][j]
                switch (type) {
                    case Connection.Soft:
                        self.softConnections |= Connection.DirectionBits[Connection.East]
                        east.softConnections |= Connection.DirectionBits[Connection.West]
                    break
                    case Connection.Hard:
                        self.hardConnections |= Connection.DirectionBits[Connection.East]
                        east.hardConnections |= Connection.DirectionBits[Connection.West]
                    break
                }
            }
        }

        // Vertical connections
        for (let i = 0; i < Level.CellCountX; i++) {
            const cellX = i * 2
            for (let j = 0; j < Level.CellCountY - 1; j++) {
                const cellY = j * 2 + 1
                const type  = Connection.CharToConnection[flippedTypeGrid[cellX][cellY]]
                const self  = blockGrid[i][j]
                const south = blockGrid[i][j + 1]
                switch (type) {
                    case Connection.Soft:
                        self.softConnections    |= Connection.DirectionBits[Connection.South]
                        south.softConnections   |= Connection.DirectionBits[Connection.North]
                    break
                    case Connection.Hard:
                        self.hardConnections    |= Connection.DirectionBits[Connection.South]
                        south.hardConnections   |= Connection.DirectionBits[Connection.North]
                    break
                }
            }
        }

        // Corner connections
        for (let i = 0; i < Level.CellCountX - 1; i++) {
            const cellX = i * 2 + 1
            for (let j = 0; j < Level.CellCountY - 1; j++) {
                const cellY     = j * 2 + 1
                const type      = Connection.CharToConnection[flippedTypeGrid[cellX][cellY]]
                const self      = blockGrid[i][j]
                const east      = blockGrid[i + 1][j]
                const south     = blockGrid[i][j + 1]
                const southeast = blockGrid[i + 1][j + 1]
                switch (type) {
                    case Connection.Soft:
                        self.softConnections        |= Connection.DirectionBits[Connection.Southeast]
                        east.softConnections        |= Connection.DirectionBits[Connection.Southwest]
                        south.softConnections       |= Connection.DirectionBits[Connection.Northeast]
                        southeast.softConnections   |= Connection.DirectionBits[Connection.Northwest]
                    break
                    case Connection.Hard:
                        self.hardConnections        |= Connection.DirectionBits[Connection.Southeast]
                        east.hardConnections        |= Connection.DirectionBits[Connection.Southwest]
                        south.hardConnections       |= Connection.DirectionBits[Connection.Northeast]
                        southeast.hardConnections   |= Connection.DirectionBits[Connection.Northwest]
                    break
                }
            }
        }

        // Add to array
        for (let i = 0; i < Level.CellCountX; i++) {
            for (let j = 0; j < Level.CellCountY; j++) {
                const block = blockGrid[i][j] 
                if (block === null) continue

                this.blocks.push(block)
            }
        }

        // Add to grid
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i]
            this.setIndices(block.x, block.y, Block.Width, Block.Height, i)
        }

        // Add walkers
        for (const walkerData of this.levelData.walkerData) {
            this.walkers.add(new Walker(walkerData[0], walkerData[1], walkerData[2]))
        }

        // Add creepers
        for (const creeperData of this.levelData.creeperData) {
            this.creepers.add(new Creeper(creeperData[0], creeperData[1], creeperData[2]))
        }

        // Add torches
        for (const torch of this.levelData.torchData) {
            this.torches.push(new Torch(torch[0], torch[1]))
        }

        // Add decorations
        for (const decoration of this.levelData.decorationData) {
            this.decorations.push(new Decoration(decoration[0], decoration[1], decoration[2]))
        }
    }
    setIndices(x: number, y: number, w: number, h: number, index: number) {
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                this.indexGrid[j * Level.GridWidth + i] = index
            }
        }
    }
    getIndex(x: number, y: number) {
        return this.indexGrid[y * Level.GridWidth + x]
    }



    pushUndoData() {
        this.undoStack.push(new UndoData(this))
    }
    popUndoData() {
        if (this.undoStack.length === 0) return

        this.undoStack.pop()!.undo()
    }







// ######   #######  #     #   #####   #     #  #######  
// #     #  #        ##   ##  #     #  #     #  #        
// #     #  #        # # # #  #     #  #     #  #        
// ######   ####     #  #  #  #     #  #     #  ####     
// #   #    #        #     #  #     #   #   #   #        
// #    #   #        #     #  #     #    # #    #        
// #     #  #######  #     #   #####      #     #######  


    // show 

    tap(gridX: number, gridY: number) {
        if (this.message.state === Message.StatePresent) {
            this.message.tap()
        }
        if (this.message.state !== Message.StateGone) return

        if (gridX < 0 || gridY < 0 || gridX >= Level.GridWidth || gridY >= Level.GridHeight) return
        
        const index = this.getIndex(gridX, gridY)
        if (index === Level.GridEmpty) return

        const block = this.blocks[index]
        if (block.message !== '' && this.message.state === Message.StateGone) {
            this.message = new Message(block.message)
        }

        if (!Block.TypeIsDestructible[block.type]) return

        this.pushUndoData()
        this.remove(index)
        this.buildBlockGroups()
        this.hoverGroup.clear()
        Sounds.playBoom()
    }
    remove(index: number) {
        // Prevents recursion into deleted blocks
        if (index === Level.GridEmpty) return

        const block = this.blocks[index]
        const x     = block.x
        const y     = block.y

        if (index !== this.blocks.length - 1) {
            const lastBlock = this.blocks[this.blocks.length - 1]
            this.blocks[index] = lastBlock
            this.setIndices(lastBlock.x, lastBlock.y, Block.Width, Block.Height, index)
        }

        this.blocks.length--
        this.setIndices(block.x, block.y, Block.Width, Block.Height, Level.GridEmpty)

        // Remove direct soft connections
        for (let i = 0; i < Connection.DirectionCount; i++) {
            if ((block.softConnections & Connection.DirectionBits[i]) === 0) continue

            const softConnectionVector  = Connection.DirectionVectors[i]
            const softConnectionX       = x + Block.Width * softConnectionVector.dx
            const softConnectionY       = y + Block.Height * softConnectionVector.dy
            const softConnectionIndex   = this.getIndex(softConnectionX, softConnectionY)
            const softConnectionBlock   = this.blocks[softConnectionIndex]
            const oppositeDirection     = Connection.OppositeDirections[i]
            const oppositeDirectionBit  = Connection.DirectionBits[oppositeDirection]
            
            softConnectionBlock.softConnections &= ~oppositeDirectionBit
        }

        // Cache cardinal directions
        const softCardinalConnection = new Array(Connection.CardinalDirectionCount).fill(false)
        for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
            const directionBit = Connection.DirectionBits[i]
            softCardinalConnection[i] = (block.softConnections & directionBit) === directionBit
        }

        // Remove adjacent diagonal soft connections
        for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
            const directionA        = i
            if (!softCardinalConnection[directionA]) continue

            const directionB        = (i + 1) % Connection.CardinalDirectionCount
            if (!softCardinalConnection[directionB]) continue

            const vectorA           = Connection.DirectionVectors[directionA]
            const vectorB           = Connection.DirectionVectors[directionB]
            const xA                = x + vectorA.dx * Block.Width
            const xB                = x + vectorB.dx * Block.Width
            const yA                = y + vectorA.dy * Block.Height
            const yB                = y + vectorB.dy * Block.Height
            const indexA            = this.getIndex(xA, yA)
            const indexB            = this.getIndex(xB, yB)
            const blockA            = this.blocks[indexA]
            const blockB            = this.blocks[indexB]
            const diagonalA         = (directionA + 1) % 4 + 4
            const diagonalB         = (directionB + 2) % 4 + 4

            // (0, 1) -> (5, 7) or [1, 3]
            // (1, 2) -> (6, 4) or [2, 0]
            // (2, 3) -> (7, 5) or [3, 1]
            // (3, 0) -> (4, 6) or [0, 2]

            blockA.softConnections  &= ~Connection.DirectionBits[diagonalA]
            blockB.softConnections  &= ~Connection.DirectionBits[diagonalB]
        }

        // Propagate removal to all hard connections
        for (let i = 0; i < Connection.DirectionCount; i++) {
            const directionBit          = Connection.DirectionBits[i]
            const hardConnection        = (block.hardConnections & directionBit) === directionBit
            if (!hardConnection) continue

            const hardConnectionVector  = Connection.DirectionVectors[i]
            const hardConnectionX       = x + Block.Width * hardConnectionVector.dx
            const hardConnectionY       = y + Block.Height * hardConnectionVector.dy
            const hardConnectionIndex   = this.getIndex(hardConnectionX, hardConnectionY)
            
            this.remove(hardConnectionIndex)
        }

        const debrisCount = Math.floor(Debris.CountMinimum + Math.random() * (Debris.CountMaximum - Debris.CountMinimum))
        for (let i = 0; i < debrisCount; i++) {
            const x     = block.x + Math.random() * Block.Width
            const y     = block.y + Math.random() * Block.Height
            const theta = Math.random() * Math.PI * 2
            const speed = Debris.SpeedMinimum + Math.random() * (Debris.SpeedMaximum - Debris.SpeedMinimum)
            const vx    = Math.cos(theta) * speed * 2.0
            const vy    = Math.sin(theta) * speed

            this.debris.add(new Debris(x, y, vx, vy))
        }
    }





    hover(gridX: number, gridY: number) {
        this.hoverGroup.clear()

        if (gridX < 0 || gridY < 0 || gridX >= Level.GridWidth || gridY >= Level.GridHeight) return
        
        const index = this.getIndex(gridX, gridY)
        if (index === Level.GridEmpty) return

        const block = this.blocks[index]
        if (block.invisible) return

        if (block.message !== '') {
            this.hoverGroup.add(index)
            return
        }

        if (!Block.TypeIsDestructible[block.type]) return
        
        this.buildHardGroup(gridX, gridY, this.hoverGroup)
    }



//  #####   ######    #####   #     #  ######   
// #     #  #     #  #     #  #     #  #     #  
// #        #     #  #     #  #     #  #     #  
// #        ######   #     #  #     #  ######   
// #   ###  #   #    #     #  #     #  #        
// #     #  #    #   #     #  #     #  #        
//  #####   #     #   #####    #####   #        

    firstBlockInGroup(groupIndex: number) {
        return this.blocks[this.groups[groupIndex][0]]
    }

    setGroupVY(groupIndex: number, vy: number) {
        const group = this.groups[groupIndex]
        for (const blockIndex of group) {
            const block = this.blocks[blockIndex]
            block.vy = vy
        }
    }

    //  Create an array of block groups, each block group containing indices of connected blocks
    buildBlockGroups() {
        this.groups                 = []
        this.groupIndex.length      = this.blocks.length
        this.groupIndex.fill(-1)



        //  For physics purposes, all fixed blocks are in group zero
        const staticGroup: number[] = []
        for (let i = 0; i < this.blocks.length; i++) {
            if (this.groupIndex[i] !== -1) continue

            const block = this.blocks[i]
            if (Block.TypeFalls[block.type]) continue

            this.buildBlockGroup(block.x, block.y, 0, staticGroup)
        }
        this.groups.push(staticGroup)

        for (let i = 0; i < this.blocks.length; i++) {
            if (this.groupIndex[i] !== -1) continue

            const block             = this.blocks[i]
            const group: number[]   = []
            this.buildBlockGroup(block.x, block.y, this.groups.length, group)
            this.groups.push(group)
        }
    }
    buildBlockGroup(x: number, y: number, groupIndex: number, group: number[]) {
        const blockIndex = this.getIndex(x, y)
        if (blockIndex === Level.GridEmpty)     return
        if (this.groupIndex[blockIndex] !== -1) return

        const block = this.blocks[blockIndex]
        this.groupIndex[blockIndex] = groupIndex
        group.push(blockIndex)

        for (let i = 0; i < Connection.DirectionCount; i++) {
            const directionBit = Connection.DirectionBits[i]
            if ((block.softConnections & directionBit) === directionBit
                || (block.hardConnections & directionBit) === directionBit
            ) {
                const vector        = Connection.DirectionVectors[i]
                const connectedX    = x + vector.dx * Block.Width
                const connectedY    = y + vector.dy * Block.Height
                this.buildBlockGroup(connectedX, connectedY, groupIndex, group)
            }
        }
    }
    buildHardGroup(x: number, y: number, hardGroup: Set<number>) {
        const blockIndex = this.getIndex(x, y)
        if (blockIndex === Level.GridEmpty) return
        if (hardGroup.has(blockIndex))      return

        hardGroup.add(blockIndex)
        const block = this.blocks[blockIndex]

        for (let i = 0; i < Connection.DirectionCount; i++) {
            const directionBit = Connection.DirectionBits[i]
            if ((block.hardConnections & directionBit) === directionBit) {
                const vector        = Connection.DirectionVectors[i]
                const connectedX    = x + vector.dx * Block.Width
                const connectedY    = y + vector.dy * Block.Height
                this.buildHardGroup(connectedX, connectedY, hardGroup)
            }
        }
    }


    // Establish contacts between all groups
    buildGroupContacts() {
        // Initialize group contacts
        const groupCount            = this.groups.length
        const groupContactsAbove    = new Array(groupCount).fill(null).map(() => new Set<number>())
        const groupContactsBelow    = new Array(groupCount).fill(null).map(() => new Set<number>())
        this.groupContactsAbove     = new Array(groupCount).fill(null).map(() => [])
        this.groupContactsBelow     = new Array(groupCount).fill(null).map(() => [])

        // Find all contacts
        for (let i = 0; i < this.blocks.length; i++) {
            const block         = this.blocks[i]
            const groupIndex    = this.groupIndex[i]
            const x             = block.x
            const y             = block.y - 1
            if (y < 0) continue

            const blockIndexAbove = this.getIndex(x, y)
            if (blockIndexAbove === Level.GridEmpty) continue

            const groupIndexAbove = this.groupIndex[blockIndexAbove]
            if (groupIndexAbove === groupIndex) continue

            groupContactsAbove[groupIndex].add(groupIndexAbove)
            groupContactsBelow[groupIndexAbove].add(groupIndex)
        }

        // Store contact sets as arrays
        for (let i = 0; i < groupCount; i++) {
            this.groupContactsAbove[i] = Array.from(groupContactsAbove[i])
            this.groupContactsBelow[i] = Array.from(groupContactsBelow[i])
        }
    }

    buildGroupImmobility() {
        const propagateImmobility = (groupIndex: number, groupContacts: number[][], groupFixed: boolean[]) => {
            if (groupFixed[groupIndex]) return

            const firstBlock = this.firstBlockInGroup(groupIndex)
            if (firstBlock.vy > Level.MaxImmobilityVelocity)   return
            if (firstBlock.vy < -Level.MaxImmobilityVelocity)  return

            groupFixed[groupIndex] = true
            this.setGroupVY(groupIndex, 0)

            const contacts = groupContacts[groupIndex]
            for (const contact of contacts) {
                propagateImmobility(contact, groupContacts, groupFixed)
            }
        }

        const groupCount    = this.groups.length
        this.groupFixedUp   = new Array(groupCount).fill(false)
        this.groupFixedDown = new Array(groupCount).fill(false)
        // First group contains all fixed blocks
        // Upward contacts cannot move down, downward contacts cannot move up

        propagateImmobility(0, this.groupContactsAbove, this.groupFixedDown)
        propagateImmobility(0, this.groupContactsBelow, this.groupFixedUp)
    }

    performGrouping() {
        this.buildBlockGroups()
        this.buildGroupContacts()
        this.buildGroupImmobility()
    }

//  #####   ######    #####   #     #  #     #  ######   
// #     #  #     #  #     #  #     #  ##    #  #     #  
// #        #     #  #     #  #     #  # #   #  #     #  
// #        ######   #     #  #     #  #  #  #  #     #  
// #   ###  #   #    #     #  #     #  #   # #  #     #  
// #     #  #    #   #     #  #     #  #    ##  #     #  
//  #####   #     #   #####    #####   #     #  ######   

    groundMovers() {
        const moverGrounded = (mover: Mover) => {
            // if (mover.vy !== 0) return false

            const floorY            = mover.y + mover.height()
            const westFootX         = mover.x
            const eastFootX         = mover.x + mover.width() - 1
            const westFloorIndex    = this.getIndex(westFootX, floorY)
            const eastFloorIndex    = this.getIndex(eastFootX, floorY)
            const westFloor         = westFloorIndex !== Level.GridEmpty
            const eastFloor         = eastFloorIndex !== Level.GridEmpty

            if (!westFloor && !eastFloor) return false

            if (westFloor) {
                const westGroupIndex = this.groupIndex[westFloorIndex]
                if (this.groupFixedDown[westGroupIndex]) return true
            }
            if (eastFloor) {
                const eastGroupIndex = this.groupIndex[eastFloorIndex]
                if (this.groupFixedDown[eastGroupIndex]) return true
            }
            return false
        }
        for (const walker of this.walkers) {
            walker.grounded = moverGrounded(walker)
        }
        for (const creeper of this.creepers) {
            creeper.grounded = moverGrounded(creeper)
        }
    }

//  #####    #####   #     #  ######      #     ######   #######  
// #     #  #     #  ##   ##  #     #    # #    #     #  #        
// #        #     #  # # # #  #     #   #   #   #     #  #        
// #        #     #  #  #  #  ######   #######  ######   ####     
// #        #     #  #     #  #        #     #  #   #    #        
// #     #  #     #  #     #  #        #     #  #    #   #        
//  #####    #####   #     #  #        #     #  #     #  #######  

    compare(num1: number, den1: number, num2: number, den2: number) {
        return num1 * den2 - num2 * den1
    }


//  #####   #     #  #######  ######   #           #     ######   
// #     #  #     #  #        #     #  #          # #    #     #  
// #     #  #     #  #        #     #  #         #   #   #     #  
// #     #  #     #  ####     ######   #        #######  ######   
// #     #   #   #   #        #   #    #        #     #  #        
// #     #    # #    #        #    #   #        #     #  #        
//  #####      #     #######  #     #  #######  #     #  #        

    overlap(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
        return    !(x1 >= x2 + w2
                ||  y1 >= y2 + h2
                ||  x2 >= x1 + w1
                ||  y2 >= y1 + h1)
    }
    headOverlap(x: number, y: number, w: number, h: number) {
        return      this.getIndex(x, y) !== Level.GridEmpty 
                ||  this.getIndex(x + w - 1, y) !== Level.GridEmpty
    }
    footOverlap(x: number, y: number, w: number, h: number) {
        const footY = y + h - 1
        return      this.getIndex(x, footY) !== Level.GridEmpty 
                ||  this.getIndex(x + w - 1, footY) !== Level.GridEmpty
    }


















// #     #  ######   ######      #     #######  #######  
// #     #  #     #  #     #    # #       #     #        
// #     #  #     #  #     #   #   #      #     #        
// #     #  ######   #     #  #######     #     ####     
// #     #  #        #     #  #     #     #     #        
// #     #  #        #     #  #     #     #     #        
//  #####   #        ######   #     #     #     #######  

    update() {

        this.message.update()
        if (this.message.state !== Message.StateGone) return

//    #      #####    #####   #######  #        #######  ######      #     #######  #######  
//   # #    #     #  #     #  #        #        #        #     #    # #       #     #        
//  #   #   #        #        #        #        #        #     #   #   #      #     #        
// #######  #        #        ####     #        ####     ######   #######     #     ####     
// #     #  #        #        #        #        #        #   #    #     #     #     #        
// #     #  #     #  #     #  #        #        #        #    #   #     #     #     #        
// #     #   #####    #####   #######  #######  #######  #     #  #     #     #     #######  

// Prepare block groupings and contacts, ground movers, and increment y-velocities

        this.performGrouping()
        this.groundMovers()
        const groupCount = this.groups.length
        for (let i = 0; i < groupCount; i++) {
            if (this.groupFixedDown[i]) continue

            const group = this.groups[i]
            for (let j = 0; j < group.length; j++) {
                const blockIndex = group[j]
                const block = this.blocks[blockIndex]
                block.vy += 0.75
            }
        }
        for (const walker of this.walkers) {
            if (!walker.grounded) {
                walker.vy += 0.6
            }
        }
        for (const creeper of this.creepers) {
            if (!creeper.grounded) {
                creeper.vy += 0.6
            }
        }

// #######  #     #  #######  #######  #######     #     #        #######  #######  #######  
//    #     ##    #     #        #        #       # #    #           #          #   #        
//    #     # #   #     #        #        #      #   #   #           #         #    #        
//    #     #  #  #     #        #        #     #######  #           #        #     ####     
//    #     #   # #     #        #        #     #     #  #           #       #      #        
//    #     #    ##     #        #        #     #     #  #           #      #       #        
// #######  #     #  #######     #     #######  #     #  #######  #######  #######  #######  

// Set the step variables for all objects
// vy:          y-velocity
// direction:   up, down, still (-1, 1, 0)
// stepTotal:   magnitude of movement
// step:        current step in total

        const step              = new Array(groupCount)
        const stepTotal         = new Array(groupCount)
        const direction         = new Array(groupCount)
        const vy                = new Array(groupCount)
        for (let i = 0; i < groupCount; i++) {
            const group         = this.groups[i]
            const block         = this.blocks[group[0]]
            step[i]             = 1
            vy[i]               = Math.floor(block.vy)
            stepTotal[i]        = Math.abs(vy[i])
            direction[i]        = Math.sign(vy[i])
        }
        for (const walker of this.walkers) {
            walker.setStepVariables()
        }
        for (const creeper of this.creepers) {
            creeper.setStepVariables()
        }

// #         #####    #####   ######   
// #        #     #  #     #  #     #  
// #        #     #  #     #  #     #  
// #        #     #  #     #  ######   
// #        #     #  #     #  #        
// #        #     #  #     #  #        
// #######   #####    #####   #        

        while (true) {
            this.performGrouping()
            this.groundMovers()

// #     #     #     ######   #######     #     ######   #        #######   #####   
// #     #    # #    #     #     #       # #    #     #  #        #        #     #  
// #     #   #   #   #     #     #      #   #   #     #  #        #        #        
// #     #  #######  ######      #     #######  ######   #        ####      #####   
//  #   #   #     #  #   #       #     #     #  #     #  #        #              #  
//   # #    #     #  #    #      #     #     #  #     #  #        #        #     #  
//    #     #     #  #     #  #######  #     #  ######   #######  #######   #####   

// Variables nextStep, nextStepTotal and nextDirection indicate which cohorts of 
// objects will attempt a move. Downward movements are prioritized.

            let nextStep        = Number.MAX_SAFE_INTEGER
            let nextStepTotal   = 1
            let nextDirection   = -1

            const updateStepVariables = (step: number, stepTotal: number, direction: number) => {
                const comparison = this.compare(step, stepTotal, nextStep, nextStepTotal)

                if (comparison > 0) return

                if (comparison < 0) {
                    nextDirection = direction
                } else if (direction === 1) {
                    nextDirection = 1
                }
                nextStep        = step
                nextStepTotal   = stepTotal
            }

            for (let i = 0; i < groupCount; i++) {
                updateStepVariables(step[i], stepTotal[i], direction[i])
            }
            for (const walker of this.walkers) {
                updateStepVariables(walker.step, walker.stepTotal, walker.fallDirection)
            }
            for (const creeper of this.creepers) {
                updateStepVariables(creeper.step, creeper.stepTotal, creeper.fallDirection)
            }

            if (nextStep > nextStepTotal) break

// #     #   #####   #     #  #######  ######    #####   
// ##   ##  #     #  #     #  #        #     #  #     #  
// # # # #  #     #  #     #  #        #     #  #        
// #  #  #  #     #  #     #  ####     ######    #####   
// #     #  #     #   #   #   #        #   #          #  
// #     #  #     #    # #    #        #    #   #     #  
// #     #   #####      #     #######  #     #   #####   

// Identify all potential movers whose step, stepTotal, and direction match the next step

            const movingGroups      = new Set<number>
            const movingWalkers     = new Set<Walker>
            const movingCreepers    = new Set<Creeper>
            for (let i = 0; i < groupCount; i++) {
                if (this.compare(step[i], stepTotal[i], nextStep, nextStepTotal) !== 0) continue
                if (direction[i] !== nextDirection)                                     continue
                
                movingGroups.add(i)
            }
            for (const walker of this.walkers) {
                if (this.compare(walker.step, walker.stepTotal, nextStep, nextStepTotal) !== 0) continue
                if (walker.fallDirection !== nextDirection)                                     continue
                // if (walker.grounded)                                                            continue
                
                movingWalkers.add(walker)
            }
            for (const creeper of this.creepers) {
                if (this.compare(creeper.step, creeper.stepTotal, nextStep, nextStepTotal) !== 0)   continue
                if (creeper.fallDirection !== nextDirection)                                        continue
                // if (creeper.grounded)                                                               continue

                movingCreepers.add(creeper)
            }

//  #####    #####   #        #        #######  ######   #######  ######    #####   
// #     #  #     #  #        #           #     #     #  #        #     #  #     #  
// #        #     #  #        #           #     #     #  #        #     #  #        
// #        #     #  #        #           #     #     #  ####     ######    #####   
// #        #     #  #        #           #     #     #  #        #   #          #  
// #     #  #     #  #        #           #     #     #  #        #    #   #     #  
//  #####    #####   #######  #######  #######  ######   #######  #     #   #####   

// Create an array of collision sets, where a collision set is all groups involved in a collision
// Currently, collision sets recursively include groups above or below the colliding group
// that match its velocity

            const buildCollisionSetAbove = (group: number, collisionSet: Set<number>) => {
                if (collisionSet.has(group)) return

                collisionSet.add(group)
                const contacts = this.groupContactsAbove[group]
                for (const groupAbove of contacts) {
                    if (vy[groupAbove] === vy[group]) {
                        buildCollisionSetAbove(groupAbove, collisionSet)
                    }
                }
            }

            const buildCollisionSetBelow = (group: number, collisionSet: Set<number>) => {
                if (collisionSet.has(group)) return

                collisionSet.add(group)
                const contacts = this.groupContactsBelow[group]
                for (const groupBelow of contacts) {
                    if (vy[groupBelow] === vy[group]) {
                        buildCollisionSetBelow(groupBelow, collisionSet)
                    }
                }
            }

            const mergedCollisionSets = (collisionSets: Set<number>[]) => {
                let mergedSets: Set<number>[] = []
                for (const collisionSet of collisionSets) {
                    let merged      = new Set(collisionSet)
                    let hasMerged   = false
                    for (let i = 0; i < mergedSets.length; i++) {
                        if ([...merged].some(group => mergedSets[i].has(group))) {
                            for (const group of merged) {
                                mergedSets[i].add(group)
                            }
                            merged = mergedSets[i]
                            hasMerged = true
                        }
                    }
                    if (!hasMerged) {
                        mergedSets.push(merged)
                    } else {
                        mergedSets = mergedCollisionSets(mergedSets)
                        break
                    }
                }
                return mergedSets
            }

            const collisionSets: Set<number>[] = []
            for (let group = 0; group < groupCount; group++) {
                const collisionSet = new Set<number>()
                collisionSet.add(group)

                const contactsAbove = this.groupContactsAbove[group]
                for (const groupAbove of contactsAbove) {
                    if (vy[groupAbove] > vy[group]) {
                        buildCollisionSetAbove(groupAbove, collisionSet)
                        // collisionSet.add(groupAbove)
                    }
                }

                const contactsBelow = this.groupContactsBelow[group]
                for (const groupBelow of contactsBelow) {
                    if (vy[groupBelow] < vy[group]) {
                        buildCollisionSetBelow(groupBelow, collisionSet)
                        // collisionSet.add(groupBelow)
                    }
                }

                if (collisionSet.size > 1) {
                    collisionSets.push(collisionSet)
                }
            }
            const collisionGroups = mergedCollisionSets(collisionSets)

            for (const collisionGroup of collisionGroups) {
                for (const group of collisionGroup) {
                    movingGroups.delete(group)
                }
            }

//  #####    #####   #        #        #######  ######   #######  
// #     #  #     #  #        #           #     #     #  #        
// #        #     #  #        #           #     #     #  #        
// #        #     #  #        #           #     #     #  ####     
// #        #     #  #        #           #     #     #  #        
// #     #  #     #  #        #           #     #     #  #        
//  #####    #####   #######  #######  #######  ######   #######  

// Perform collisions by solving equations in math.txt
// Solve for collective conservation of momentum and pairwise coefficient of restitution
// Update step variables after collision

            const groupFixed = nextDirection === 1 ? this.groupFixedDown : this.groupFixedUp
            for (const collisionGroup of collisionGroups) {
                const collisionGroupCount   = collisionGroup.size
                const e                     = Level.BlockElasticity + 1
                const vi                    = new Array(collisionGroupCount)
                const m                     = new Array(collisionGroupCount)
                let totalMass               = 0
                let fixedCollision          = false

                for (const groupIndex of collisionGroup) {
                    const group         = this.groups[groupIndex]
                    vi[groupIndex]      = this.firstBlockInGroup(groupIndex).vy
                    m[groupIndex]       = group.length
                    totalMass           += m[groupIndex]

                    if (groupFixed[groupIndex]) {
                        fixedCollision = true
                    }
                }

                if (fixedCollision) {
                    totalMass = 0
                    for (const groupIndex of collisionGroup) {
                        if (groupFixed[groupIndex]) {
                            m[groupIndex] = 1
                            totalMass++
                        } else {
                            m[groupIndex] = 0
                        }
                    }
                }

                for (const groupIndex of collisionGroup) {
                    let weightedMasses  = 0
                    for (const otherIndex of collisionGroup) {
                        if (groupIndex === otherIndex) continue

                        weightedMasses += m[otherIndex] * (vi[groupIndex] - vi[otherIndex])
                    }

                    const vf = Math.trunc(vi[groupIndex] - (e * weightedMasses) / totalMass)
                    const dy = Math.abs(vf - vy[groupIndex])
                    this.camera.shake(dy * dy * this.groups[groupIndex].length * Level.ShakeMultiplier) // Mass has been adjusted, use group size instead
                    this.setGroupVY(groupIndex, vf)
                    vy[groupIndex]              = vf
                    stepTotal[groupIndex]       = Math.abs(vf)
                    direction[groupIndex]       = Math.sign(vf)

                    if (stepTotal[groupIndex] === 0) {
                        step[groupIndex]        = 2
                        stepTotal[groupIndex]   = 1
                    } else {
                        step[groupIndex]        = Math.ceil(stepTotal[groupIndex] * nextStep / nextStepTotal)
                    }
                }
            }

// ######   ######   #     #  #     #  #######  
// #     #  #     #  #     #  ##    #  #        
// #     #  #     #  #     #  # #   #  #        
// ######   ######   #     #  #  #  #  ####     
// #        #   #    #     #  #   # #  #        
// #        #    #   #     #  #    ##  #        
// #        #     #   #####   #     #  #######  

// After collisions and recalculation of step variables, some objects may be scheduled to move that are not able to move or collide
// Remove these from the movers list
            for (const groupIndex of movingGroups) {
                const contacts = nextDirection === 1 ? this.groupContactsBelow[groupIndex] : this.groupContactsAbove[groupIndex]
                for (const contact of contacts) {
                    if (!movingGroups.has(contact)) {
                        step[groupIndex]++
                        movingGroups.delete(groupIndex)
                        break
                    }
                }
            }

// #     #   #####   #     #  #######  
// ##   ##  #     #  #     #  #        
// # # # #  #     #  #     #  #        
// #  #  #  #     #  #     #  ####     
// #     #  #     #   #   #   #        
// #     #  #     #    # #    #        
// #     #   #####      #     #######  

// Perform movements of blocks
            for (const groupIndex of movingGroups) {
                const group = this.groups[groupIndex]
                for (const blockIndex of group) {
                    const block         = this.blocks[blockIndex]
                    this.setIndices(block.x, block.y, Block.Width, Block.Height, Level.GridEmpty)
                }
            }
            for (const groupIndex of movingGroups) {
                const group = this.groups[groupIndex]
                for (const blockIndex of group) {
                    const block         = this.blocks[blockIndex]
                    block.y             += nextDirection
                    this.setIndices(block.x, block.y, Block.Width, Block.Height, blockIndex)
                }
                step[groupIndex]++
            }
            this.fireBeams()


// #     #  #######  #######  
// #     #     #        #     
// #     #     #        #     
// #######     #        #     
// #     #     #        #     
// #     #     #        #     
// #     #  #######     #     

            for (const walker of movingWalkers) {
                walker.y += nextDirection
                walker.step++
            }
            for (const creeper of movingCreepers) {
                creeper.y += nextDirection
                creeper.step++
            }

// ######    #####   #     #  #     #   #####   #######  
// #     #  #     #  #     #  ##    #  #     #  #        
// #     #  #     #  #     #  # #   #  #        #        
// ######   #     #  #     #  #  #  #  #        ####     
// #     #  #     #  #     #  #   # #  #        #        
// #     #  #     #  #     #  #    ##  #     #  #        
// ######    #####    #####   #     #   #####   #######  

            const bounce = (mover: Mover, moverSet: Set<Mover>) => {
                const head              = mover.y
                const above             = head - 1
                const below             = head + mover.height()
                const foot              = below - 1

                const west              = mover.x
                const east              = west + mover.width() - 1

                const blockEastFoot     = this.getIndex(east, foot)
                const blockWestFoot     = this.getIndex(west, foot)

                const blockEastHead     = this.getIndex(east, head)
                const blockWestHead     = this.getIndex(west, head)

                const blockEastBelow    = this.getIndex(east, below)
                const blockWestBelow    = this.getIndex(west, below)

                const blockEastAbove    = this.getIndex(east, above)
                const blockWestAbove    = this.getIndex(west, above)

                const overlapEastFoot   = blockEastFoot !== Level.GridEmpty
                const overlapWestFoot   = blockWestFoot !== Level.GridEmpty

                const overlapEastHead   = blockEastHead !== Level.GridEmpty
                const overlapWestHead   = blockWestHead !== Level.GridEmpty

                const contactEastBelow  = blockEastBelow !== Level.GridEmpty
                const contactWestBelow  = blockWestBelow !== Level.GridEmpty
                const contactWestAbove  = blockWestAbove !== Level.GridEmpty
                const contactEastAbove  = blockEastAbove !== Level.GridEmpty

                const overlapFoot       = overlapEastFoot || overlapWestFoot
                const overlapHead       = overlapEastHead || overlapWestHead

                if (!overlapFoot && !overlapHead) return

                const contactBelow      = contactEastBelow || contactWestBelow
                const contactAbove      = contactEastAbove || contactWestAbove
                
                const squish            = (overlapFoot && contactAbove) || (overlapHead && contactBelow)
                
                let vy = 0
                if (overlapFoot) {
                    mover.y--
                    if (overlapEastFoot && overlapWestFoot) {
                        vy = Math.min(this.blocks[blockEastFoot].vy, this.blocks[blockWestFoot].vy)
                    } else {
                        vy = overlapEastFoot ? this.blocks[blockEastFoot].vy : this.blocks[blockWestFoot].vy
                    }
                   
                    if (vy >= mover.vy) {
                        return
                    }
                } else if (overlapHead) {
                    mover.y++
                    if (overlapEastHead && overlapWestHead) {
                        vy = Math.min(this.blocks[blockEastHead].vy, this.blocks[blockWestHead].vy)
                    } else {
                        vy = overlapEastHead ? this.blocks[blockEastHead].vy : this.blocks[blockWestHead].vy
                    }
                    
                    if (vy <= mover.vy) {
                        return
                    }
                }

                const vyf           = Math.trunc(mover.vy + (1 + Level.MoverElasticity) * (vy - mover.vy))
                const acceleration  = Math.abs(vyf - mover.vy)
                mover.vy            = vyf
                mover.stepTotal     = Math.abs(mover.vy)
                mover.fallDirection = Math.sign(mover.vy)

                if (mover.stepTotal === 0) {
                    mover.step      = 2
                    mover.stepTotal = 1
                } else {
                    mover.step          = Math.ceil(mover.stepTotal * nextStep / nextStepTotal)
                }

                if (squish || (mover instanceof Walker && acceleration > 9)) {
                    mover.vy = 0
                    this.splatterMover(mover)
                    this.kill(mover, moverSet)
                    Sounds.playSplat()
                }

            }
            this.fireBeams()
            this.eat()

//  #####    #####   #     #  #######   #####   #     #  
// #     #  #     #  #     #     #     #     #  #     #  
// #        #     #  #     #     #     #        #     #  
//  #####   #  #  #  #     #     #      #####   #######  
//       #  #   # #  #     #     #           #  #     #  
// #     #  #    #   #     #     #     #     #  #     #  
//  #####    #### #   #####   #######   #####   #     #  


            for (const walker of this.walkers) {
                bounce(walker, this.walkers)
            }
            for (const creeper of this.creepers) {
                bounce(creeper, this.creepers)
            }
        }

        if (this.frame % 2 === 0) {
            this.performGrouping()
            this.groundMovers()

            const walk = (mover: Mover) => {
                let xFront          = 0
                let xBack           = 0
                let xNext           = 0
            
                if (mover.vx === 1) {
                    xBack   = mover.x
                    xNext   = xBack + mover.width()
                    xFront  = xNext + 1
                } else {
                    xFront  = mover.x
                    xBack   = xFront + mover.width() - 1
                    xNext   = xFront - 1
                }
                // const x 
                // const nextX         = mover.vx === 1 ? mover.x + mover.width() : mover.x - 1
                // const backX         = mover.vx === 1 ? mover.x : mover.x + mover.width() - 1

                const head          = mover.y
                const floor         = head + mover.height()
                const foot          = floor - 1

                const blockHead     = this.getIndex(xNext, head) !== Level.GridEmpty
                const blockFoot     = this.getIndex(xNext, foot) !== Level.GridEmpty
                const emptyFloor    = this.getIndex(xNext, floor) === Level.GridEmpty

                const backIndex     = this.getIndex(xBack, floor)
                const frontIndex    = this.getIndex(xFront, floor)

                const slide         =       (backIndex !== Level.GridEmpty && this.blocks[backIndex].type === Block.Ice)
                                        ||  (frontIndex !== Level.GridEmpty && this.blocks[frontIndex].type === Block.Ice)

                if (blockHead || blockFoot || (emptyFloor && mover.grounded && !slide)) {
                    mover.walkDirection *= -1
                    mover.vx *= -1
                } else {
                    const middleX           = mover.x + Walker.Width / 2
                    const middleBlockIndex  = this.getIndex(middleX, floor)
                    if (mover instanceof Walker
                        && mover.grounded
                        && middleBlockIndex !== Level.GridEmpty
                        && middleX % Block.Width === Block.Width / 2
                    ) {
                        const block = this.blocks[middleBlockIndex]
                        if (block.altar) {
                            this.walkers.delete(mover)
                            Sounds.playVanish()
                            return
                        } else if (block.warp) {
                            for (const pair of this.blocks) {
                                if (!pair.warp)                                                         continue
                                if (pair === block)                                                     continue
                                if (pair.color !== block.color)                                         continue
                                if (this.getIndex(pair.x, pair.y - Walker.Height) !== Level.GridEmpty)  continue

                                mover.y = pair.y - Walker.Height
                                mover.x = pair.x + (mover.x - block.x)
                                Sounds.playWhoosh()
                                break
                            }
                        }
                    }
                    if (slide) {
                        mover.walkDirection *= -1
                    } else {
                        mover.walkDirection = mover.vx
                    }
                    mover.x += mover.vx
                }
            }

            for (const walker of this.walkers) {
                walk(walker)
            }
            for (const creeper of this.creepers) {
                walk(creeper)
            }
            this.fireBeams()
            this.eat()
        }

        this.createSparks()
        this.createDroplets()

        this.updateSplatters()
        this.updateDebris()
        this.updateDroplets()
        this.updateSplashes()
        this.updateSparks()

        this.frame++
    }
























































    complete() {
        return this.deaths === 0 && this.walkers.size === 0
    }
    kill(mover: Mover, moverSet: Set<Mover>) {
        moverSet.delete(mover)
        if (mover instanceof Walker) {
            this.deaths++
        }
    }


    lift() {
        for (const block of this.blocks) {
            if (!block.altar) continue

            const blockLeft     = block.x
            const blockRight    = blockLeft + Block.Width - 1
            const blockTop      = block.y

            for (const walker of this.walkers) {
                const left     = walker.x
                const right    = left + Walker.Width - 1
                const floor    = walker.y + Walker.Height

                if (floor === blockTop && left >= blockLeft && right <= blockRight) {
                    this.walkers.delete(walker)
                }
            }
        }
    }

    rectangleIntersection(
        x1: number, y1: number, w1: number, h1: number, 
        x2: number, y2: number, w2: number, h2: number
    ) {
        return !(   x1 > x2 + w2
            ||      y1 > y2 + h2
            ||      x2 > x1 + w1 
            ||      y2 > y1 + h1)
    }
    beams() {
        const beams: Beam[] = []
        for (const block of this.blocks) {
            if (block.type !== Block.Beam) continue

            const x     = block.x + Block.Width / 2
            const y     = block.y + Block.Height / 2
            const beam  = this.beam(x, y, block.direction)
            beams.push(beam)
        }
        return beams
    }
    beam(x: number, y: number, direction: number): Beam {
        switch (direction) {
            case Connection.East: {
                let impactX = Level.GridWidth - 1
                for (const block of this.blocks) {
                    const xw = block.x
                    const yn = block.y
                    const ys = yn + Block.Height - 1
                    if (xw > x && xw < impactX && y >= yn && y <= ys) {
                        impactX = xw
                    }
                }
                return new Beam(x, y, impactX, y, direction)
            }
            case Connection.West: {
                let impactX = 0
                for (const block of this.blocks) {
                    const xe = block.x + Block.Width
                    const yn = block.y
                    const ys = yn + Block.Height - 1
                    if (xe < x && xe > impactX && y >= yn && y <= ys) {
                        impactX = xe
                    }
                }
                return new Beam(x, y, impactX, y, direction)
            }
            case Connection.South: {
                let impactY = Level.GridHeight - 1
                for (const block of this.blocks) {
                    const yn = block.y
                    const xw = block.x
                    const xe = xw + Block.Width - 1
                    if (yn > y && yn < impactY && x >= xw && x <= xe) {
                        impactY = yn
                    }
                }
                return new Beam(x, y, x, impactY, direction)
            }
            case Connection.North: {
                let impactY = 0
                for (const block of this.blocks) {
                    const ys = block.y + Block.Height
                    const xw = block.x
                    const xe = xw + Block.Width - 1
                    if (ys < y && ys > impactY && x >= xw && x <= xe) {
                        impactY = ys
                    }
                }
                return new Beam(x, y, x, impactY, direction)
            }
        }
        return new Beam(x, y, x, y, direction)
    }

    fireBeam(beam: Beam, mover: Mover, moverSet: Set<Mover>) {
        const x = Math.min(beam.x1, beam.x2)
        const y = Math.min(beam.y1, beam.y2)
        const w = Math.abs(beam.x2 - beam.x1)
        const h = Math.abs(beam.y2 - beam.y1)
        if (this.rectangleIntersection(x, y, w, h, mover.x, mover.y, mover.width(), mover.height())) {
            this.splatterMover(mover)
            this.kill(mover, moverSet)
            Sounds.playZap()
        }
    }
    fireBeams() {
        const beams = this.beams()
        for (const beam of beams) {
            for (const walker of this.walkers) {
                this.fireBeam(beam, walker, this.walkers)
            }
            for (const creeper of this.creepers) {
                this.fireBeam(beam, creeper, this.creepers)
            }
        }
    }



    eat() {
        for (const creeper of this.creepers) {
            for (const walker of this.walkers) {
                if (this.contact(creeper, walker)) {
                    this.splatterMover(walker)
                    this.kill(walker, this.walkers)
                    Sounds.playSplat()
                }
            }
        }
    }

    contact(creeper: Creeper, walker: Walker) {
        return !(creeper.x + Creeper.Width <= walker.x
                || walker.x + Walker.Width <= creeper.x 
                || creeper.y + Creeper.Height <= walker.y 
                || walker.y + Walker.Height <= creeper.y)
    }

    splatterMover(mover: Mover) {
        const count = Splatter.CountMinimum + Math.floor(Splatter.CountMaximum - Splatter.CountMinimum)
        const x     = mover.x + mover.width() / 2
        const y     = mover.y + mover.height()
        for (let i = 0; i < count; i++) {
            this.splatters.add(new Splatter(x, y, mover.vy))
        }
    }
    signedSide(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
        return (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
    }

    // (x, y)   : Point in block
    // (x1, y1) : Point outside block
    // x2       : Vertical edge of block
    // y2, y3   : Horizontal edges of block
    verticalIntersection(x: number, y: number, x1: number, y1: number, x2: number, y2: number, y3: number) {
        const side1 = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
        const side2 = (x - x1) * (y3 - y1) - (y - y1) * (x2 - x1)

        // const side1 = (x - a) * (d - b) - (y - b) * (c - a)
        // const side2 = (x - a) * (f - b) - (y - b) * (c - a)
        // side1 * side2 = ((x - a) * (d - b) - (y - b) * (c - a)) * ((x - a) * (f - b) - (y - b) * (c - a))
        // side1 * side2 = (r * (d - b) - s * t) * (r * (f - b) - s * t)

        return side1 * side2 < 0
    }

    updateDebris() {
        for (const debris of this.debris) {
            if (debris.y > Level.GridHeight) {
                this.debris.delete(debris)
                continue
            }

            debris.vy           += Debris.FallSpeed
            debris.vx           *= 0.975
            debris.vy           *= 0.975
            let x               = debris.x + debris.vx
            let y               = debris.y + debris.vy
            const blockIndex    = this.getIndex(Math.floor(x), Math.floor(y))

            if (blockIndex !== Level.GridEmpty) {
                if (Math.random() < 0.4) {
                    this.debris.delete(debris)
                    continue
                }

                const block = this.blocks[blockIndex]
                let xSector = 0
                if (debris.x >= block.x + Block.Width) {
                    xSector = 2
                } else if (debris.x >= block.x) {
                    xSector = 1
                }

                let ySector = 0
                if (debris.y >= block.y + Block.Height) {
                    ySector = 6
                } else if (debris.y >= block.y) {
                    ySector = 3
                }

                const sector = xSector + ySector
                let horizontal = true

                switch (sector) {
                    case 3:
                    case 5:
                        horizontal = false
                    break

                    case 0:
                    case 6:
                        if (this.verticalIntersection(x, y, debris.x, debris.y, block.x, block.y, block.y + Block.Height)) {
                            horizontal = false
                        }
                    break

                    case 2:
                    case 8:
                        if (this.verticalIntersection(x, y, debris.x, debris.y, block.x + Block.Width, block.y, block.y + Block.Height)) {
                            horizontal = false
                        }
                    break
                }

                if (horizontal) {
                    debris.vy += (1 + 0.3) * (block.vy - debris.vy)
                } else {
                    debris.vx += (1 + 0.3) * -debris.vx
                }
            } else {
                debris.x = x
                debris.y = y
            }
        }
    }
    updateSplatters() {
        for (const splatter of this.splatters) {
            splatter.vy += Splatter.FallSpeed
            splatter.x  += splatter.vx
            splatter.y  += splatter.vy
            const x     = Math.floor(splatter.x)
            const y     = Math.floor(splatter.y)

            if (x < 0 || y < 0 || x >= Level.GridWidth || y > Level.GridHeight) {
                this.splatters.delete(splatter)
                continue
            }

            const index = this.getIndex(x, y)
            if (index !== Level.GridEmpty && Math.random() > 0.5) {
                const block         = this.blocks[index]
                const blockX        = x - block.x
                const blockY        = y - block.y
                splatter.x          = blockX
                splatter.y          = blockY
                block.splatters.push(splatter)
                this.splatters.delete(splatter)
            }
        }

        // this.splatters = this.splatters.filter(splatter => splatter.y < Level.GridHeight && !splatter.splattered)
    }


    createSparks() {
        const beams = this.beams()

        for (const beam of beams) {
            const count = 1// + Math.floor(Math.random() * 2)
            for (let i = 0; i < count; i++) {
                const theta = Math.random() * Level.Tau
                const v     = 2 + Math.random()
                const vx    = Math.cos(theta) * v
                const vy    = Math.sin(theta) * v
                const spark = new Spark(beam.x2, beam.y2, vx, vy)
                this.sparks.add(spark)
            }
        }
    }
    updateSparks() {
        for (const spark of this.sparks) {
            if (spark.y > Level.GridHeight) {
                this.sparks.delete(spark)
                continue
            }
            spark.frame++
            if (spark.frame > spark.life) {
                this.sparks.delete(spark)
                continue
            }

            spark.vy           += Spark.FallSpeed
            spark.vx           *= 0.9
            spark.vy           *= 0.9
            let x               = spark.x + spark.vx
            let y               = spark.y + spark.vy
            const blockIndex    = this.getIndex(Math.floor(x), Math.floor(y))

            if (blockIndex !== Level.GridEmpty) {
                const block = this.blocks[blockIndex]
                let xSector = 0
                if (spark.x >= block.x + Block.Width) {
                    xSector = 2
                } else if (spark.x >= block.x) {
                    xSector = 1
                }

                let ySector = 0
                if (spark.y >= block.y + Block.Height) {
                    ySector = 6
                } else if (spark.y >= block.y) {
                    ySector = 3
                }

                const sector = xSector + ySector
                let horizontal = true

                switch (sector) {
                    case 3:
                    case 5:
                        horizontal = false
                    break

                    case 0:
                    case 6:
                        if (this.verticalIntersection(x, y, spark.x, spark.y, block.x, block.y, block.y + Block.Height)) {
                            horizontal = false
                        }
                    break

                    case 2:
                    case 8:
                        if (this.verticalIntersection(x, y, spark.x, spark.y, block.x + Block.Width, block.y, block.y + Block.Height)) {
                            horizontal = false
                        }
                    break
                }

                if (horizontal) {
                    spark.vy += (1 + 0.5) * (block.vy - spark.vy)
                } else {
                    spark.vx += (1 + 0.5) * -spark.vx
                }
            } else {
                spark.x = x
                spark.y = y
            }
        }
    }



    createDroplets() {
        if (Math.random() > 0.6) return

        // Find a stationary block that has room underneath it to create a drop
        let dropletBlocks: Block[] = []
        for (const block of this.blocks) {
            if (Block.TypeFalls[block.type]) continue
            
            const y = block.y + Block.Height
            if (block.y === Level.GridHeight - Block.Height) continue
            if (this.getIndex(block.x, y) !== Level.GridEmpty) continue
               
            dropletBlocks.push(block)
        }

        const count = dropletBlocks.length
        if (count === 0) return

        const block     = dropletBlocks[Math.floor(Math.random() * count)]
        const y         = block.y + Block.Height
        const x         = block.x + Math.floor(Math.random() * Block.Width)

        this.droplets.add(new Droplet(x, y))
    }
    updateDroplets() {
        for (const droplet of this.droplets) {
            droplet.vy  += 0.3
            droplet.y   += droplet.vy
            const x     = Math.floor(droplet.x)
            let y       = Math.floor(droplet.y)
            if (droplet.y >= Level.GridHeight || this.getIndex(x, y) !== Level.GridEmpty) {
                this.droplets.delete(droplet)

                let index = this.getIndex(x, y)
                let validIndex = index
                while (index !== Level.GridEmpty) {
                    validIndex = index
                    y--
                    index = this.getIndex(x, y)
                }

                const block = this.blocks[validIndex]
                const splashCount = 6 + Math.floor(Math.random() * 3)
                for (let i = 0; i < splashCount; i++) {
                    const speed     = 1.0 + Math.random() * 0.5
                    const theta     = Math.PI + Math.random() * Math.PI
                    const vx        = Math.cos(theta) * speed
                    const vy        = Math.sin(theta) * speed + block.vy
                    const splash    = new Splash(x, y, vx, vy)
                    this.splashes.add(splash)
                }

                // Sounds.playSplash()
            }
        }
    }
    updateSplashes() {
        for (const splash of this.splashes) {
            splash.vy   += 0.3
            splash.y    += splash.vy
            splash.x    += splash.vx
            const x = Math.floor(splash.x)
            const y = Math.floor(splash.y)
            if (splash.y >= Level.GridHeight || this.getIndex(x, y) !== Level.GridEmpty) {
                this.splashes.delete(splash)
            }
        }
    }






























    public static readonly SplatterRGB              = '#9f040460'
    public static readonly DebrisRGBPrefix          = 'rgba(115, 65, 32, '
    smooth(x: number) {
        return x * (3 * x - 2 * x * x)
    }
    smoothSine(x: number) {
        const sin = Math.sin(Math.PI * x / 2)
        return sin * sin
    }


    renderBricks(context: CanvasRenderingContext2D, offsetY: number) {
        const rng                           = new RNG()
        const brickWidth                    = Block.Width * 2
        context.fillStyle                   = 'black'
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        for (let j = 0; j < Level.CellCountY; j++) {
            const y = j * Block.Height + offsetY
            for (let i = j % 2 === 0 ? -1 : 0; i < Level.CellCountX; i += 2) {
                const x = i * Block.Width
                context.drawImage(
                    Images.Bricks, 
                    brickWidth * (rng.nextInt() % 3), 
                    0, 
                    brickWidth, 
                    Block.Height, 
                    x,
                    y,
                    brickWidth, 
                    Block.Height
                )
            }
        }
    }
    renderTorches(context: CanvasRenderingContext2D, offsetY: number) {
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        const rng                           = new RNG(this.frame * this.frame)
        
        for (const torch of this.torches) {
            const offsetX = Math.floor((this.frame + torch.frame) / 2) % 5 * Block.Width
            context.drawImage(
                Images.Torch, 
                offsetX, 0, Block.Width, Block.Height, 
                torch.x, torch.y + offsetY, Block.Width, Block.Height)
        }
        
        for (const torch of this.torches) {
            const radius    = 35 + rng.nextFloat() * 3
            const diameter  = radius * 2
            const cx        = torch.x + Block.Width / 2 + rng.nextFloat() * 2 - 1
            const cy        = torch.y + Block.Height / 2 + rng.nextFloat() * 2 - 1
            const gradient  = context.createRadialGradient(cx, cy + offsetY, 0, cx, cy + offsetY, radius)
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.2)')
            gradient.addColorStop(0.5, 'rgba(255, 128, 0, 0.015)')
            gradient.addColorStop(0.75, 'rgba(255, 0, 0, 0.01)')
            gradient.addColorStop(1, 'rgba(128, 0, 0, 0)')
            context.fillStyle = gradient
            context.fillRect(cx - radius, cy - radius + offsetY, diameter, diameter)
        }
    }

    renderBeams(context: CanvasRenderingContext2D, offsetY: number) {
        const rng                           = new RNG(this.frame * this.frame)
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        context.strokeStyle                 = `rgba(255, 192, 0, ${0.5 + 0.5 * this.smoothSine(this.frame * 0.05)})`
        context.beginPath()
        for (const beam of this.beams()) {
            context.moveTo(beam.x1, beam.y1 + offsetY)
            context.lineTo(beam.x2, beam.y2 + offsetY)
        }
        context.stroke()

        for (const beam of this.beams()) {
            const radius    = 7 + rng.nextFloat() * 2
            const diameter  = radius * 2
            const cx        = beam.x2
            const cy        = beam.y2 + offsetY
            const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius)
            gradient.addColorStop(0, '#fc0')
            gradient.addColorStop(0.25, '#fc06')
            gradient.addColorStop(1, '#fc00')
            context.fillStyle = gradient
            context.fillRect(cx - radius, cy - radius, diameter, diameter)
        }



        // context.fillStyle = `rgba(255, 255, 0, ${0.25 + 0.25 * this.smooth(frame * 0.05)})`
        // for (const beam of this.beams()) {
        //     renderBeam(beam, 20)
        // }

        // context.fillStyle = `rgba(255, 255, 0, ${0.5 + 0.5 * this.smooth(frame * 0.05)})`
        // for (const beam of this.beams()) {
        //     renderBeam(beam, 10)
        // }
    }

    renderWalkers(context: CanvasRenderingContext2D, offsetY: number) {
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        for (const walker of this.walkers) {
            const offsetX       = (Math.floor(this.frame / 3) + walker.frameOffset) % Walker.Frames
            const spriteSheet   = walker.walkDirection === 1 ? Images.WalkerRight : Images.WalkerLeft
            context.drawImage(
                spriteSheet, 
                offsetX * Walker.Width, 
                0, 
                Walker.Width, 
                Walker.Height,
                walker.x, 
                walker.y + offsetY, 
                Walker.Width, 
                Walker.Height)
        }
    }

    renderCreepers(context: CanvasRenderingContext2D, offsetY: number) {
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        for (const creeper of this.creepers) {
            const offsetX       = (Math.floor(this.frame / 3) + creeper.frameOffset) % Creeper.Frames
            const spriteSheet   = creeper.walkDirection === 1 ? Images.CreeperRight : Images.CreeperLeft
            context.drawImage(
                spriteSheet, 
                offsetX * Creeper.Width, 
                0, 
                Creeper.Width, 
                Creeper.Height,
                creeper.x, 
                creeper.y + offsetY, 
                Creeper.Width, 
                Creeper.Height)
        }
    }

    renderAltars(context: CanvasRenderingContext2D, offsetY: number) {
        const rng                           = new RNG()
        const height                        = Block.Height / 2
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1

        for (const block of this.blocks) {
            if (!block.altar && !block.warp) continue

            for (let i = 0; i < 30; i++) {
                const rand              = rng.nextInt()
                const h                 = Math.floor(height * rng.nextFloat() * 1.5)
                const x                 = block.x + 1 + rand % (Block.Width - 2)
                const position          = (rng.nextInt() + Math.floor(this.frame / 2)) % h / h
                const scaledPosition    = position * position
                const y                 = block.y - 1 - scaledPosition * h + offsetY
                if (block.warp) {
                    context.fillStyle = Color.colorWithAlpha(block.color, 1.0 - scaledPosition)
                } else {
                    context.fillStyle = `rgba(255, 255, 255, ${ 1.0 - scaledPosition })`
                }
                context.fillRect(x, y, 1, 1)
            }
        }
    }

    renderBlocks(context: CanvasRenderingContext2D, offsetY: number) {
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        for (const block of this.blocks) {
            if (block.invisible) continue
            
            switch (block.type) {
                case Block.Aurox: {
                    context.drawImage(
                        Images.Aurox, 
                        block.x, 
                        block.y + offsetY)
                    break
                }
                case Block.Beam: {
                    context.drawImage(
                        Images.Beams, 
                        block.direction * Block.Width, 
                        0, 
                        Block.Width, 
                        Block.Height,
                        block.x, 
                        block.y + offsetY, 
                        Block.Width, 
                        Block.Height)
                    break
                }
                default: {
                    context.drawImage(
                        Images.BlockTilesetMap[block.type], 
                        Images.OffsetMap[block.hardConnections] * Block.Width, 
                        0, 
                        Block.Width, 
                        Block.Height,
                        block.x, 
                        block.y + offsetY, 
                        Block.Width, 
                        Block.Height)
                    break
                }
            }
            
            if (block.softConnections === 0) continue

            context.drawImage(
                Images.StrappingTileset, 
                Images.OffsetMap[block.softConnections] * Block.Width, 
                0, 
                Block.Width, 
                Block.Height,
                block.x, 
                block.y + offsetY, 
                Block.Width, 
                Block.Height)
        }
    }

    renderSelection(context: CanvasRenderingContext2D, offsetY: number) {
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        const srcY = Block.Height * (Math.floor(this.frame / 4) % 4)
        for (const index of this.hoverGroup) {
            const block = this.blocks[index]
            context.drawImage(
                Images.SelectionTileset, 
                Images.OffsetMap[block.hardConnections] * Block.Width, 
                srcY, 
                Block.Width, 
                Block.Height,
                block.x, 
                block.y + offsetY, 
                Block.Width, 
                Block.Height)
        }
    }

    renderInfo(context: CanvasRenderingContext2D, offsetY: number) {
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        context.fillStyle                   = 'white'
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i]
            const x     = block.x
            const y     = block.y
            const group = this.groupIndex[i]
            context.fillText(group + '', x + 7, y + offsetY + 11)
            context.fillText(i + '', x + 2, y + offsetY  + 25)
        }
    }

    renderSplatters(context: CanvasRenderingContext2D, offsetY: number) {
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        context.fillStyle                   = Level.SplatterRGB
        for (const block of this.blocks) {
            for (const splatter of block.splatters) {
                const x = block.x + Math.floor(splatter.x)
                const y = block.y + Math.floor(splatter.y)
                context.fillRect(x, y + offsetY, 1, 1)
            }
        }
        for (const splatter of this.splatters) {
            const x = Math.floor(splatter.x)
            const y = Math.floor(splatter.y)
            context.fillRect(x, y + offsetY, 1, 1)
        }
    }

    renderSparks(context: CanvasRenderingContext2D, offsetY: number) {
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        for (const spark of this.sparks) {
            const x             = Math.floor(spark.x)
            const y             = Math.floor(spark.y)
            const opacity       = 1.0 - spark.frame / spark.life
            context.fillStyle   = `rgba(255, 192, 0, ${ opacity })`
            context.fillRect(x, y + offsetY, 1, 1)
        }
    }

    renderDebris(context: CanvasRenderingContext2D, offsetY: number) {
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        context.fillStyle                   = '#fff3'
        for (const debris of this.debris) {
            const x             = Math.floor(debris.x)
            const y             = Math.floor(debris.y)
            context.fillRect(x, y + offsetY, 1, 1)
        }
    }

    renderDroplets(context: CanvasRenderingContext2D, offsetY: number) {
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        context.fillStyle                   = '#248'
        const rng                           = new RNG()
        
        for (const droplet of this.droplets) {
            const x             = Math.floor(droplet.x)
            const y             = Math.floor(droplet.y)
            context.fillRect(x, y + offsetY, 1, 1)
        }
        context.fillStyle = '#2488'
        for (const splash of this.splashes) {
            const x             = Math.floor(splash.x)
            const y             = Math.floor(splash.y)
            context.fillRect(x, y + offsetY, 1, 1)
        }
        context.fillStyle = '#fff4'
        for (const droplet of this.droplets) {
            if (rng.nextFloat() > 0.1) continue

            const x             = Math.floor(droplet.x)
            const y             = Math.floor(droplet.y)
            context.fillRect(x, y + offsetY, 1, 1)
        }
        context.fillStyle = '#fff2'
        for (const splash of this.splashes) {
            if (rng.nextFloat() > 0.1) continue

            const x             = Math.floor(splash.x)
            const y             = Math.floor(splash.y)
            context.fillRect(x, y + offsetY, 1, 1)
        }
    }

    renderDecorations(context: CanvasRenderingContext2D, offsetY: number) {
        context.globalCompositeOperation    = 'source-over'
        context.globalAlpha                 = 1
        for (const decoration of this.decorations) {
            context.drawImage(Images.DecorationsMap[decoration.type], decoration.x * Block.Width, decoration.y * Block.Height + offsetY)
        }
    }


    render(canvas: HTMLCanvasElement, offsetY: number) {
        const context = canvas.getContext('2d')!

        this.renderBricks(context, offsetY)
        this.renderDecorations(context, offsetY)
        this.renderBeams(context, offsetY)
        this.renderWalkers(context, offsetY)
        this.renderCreepers(context, offsetY)
        this.renderAltars(context, offsetY)
        this.renderDebris(context, offsetY)
        this.renderSparks(context, offsetY)
        this.renderBlocks(context, offsetY)
        // this.renderInfo(context, offsetY)
        this.renderSplatters(context, offsetY)
        this.renderDroplets(context, offsetY)
        this.renderSelection(context, offsetY)
    }

    renderLight(lightCanvas: HTMLCanvasElement, offsetY: number) {
        const lightContext                      = lightCanvas.getContext('2d')!
        // const overlayCanvas                     = document.createElement('canvas')
        // overlayCanvas.width                     = Level.GridWidth
        // overlayCanvas.height                    = Level.GridHeight
        // const overlayContext                    = overlayCanvas.getContext('2d')!
        // overlayContext.globalCompositeOperation = 'multiply'
        lightContext.globalCompositeOperation   = 'destination-out'
        const rng                               = new RNG(this.frame * this.frame)

        for (const torch of this.torches) {
            const radius = 160 + rng.nextFloat() * 3
            const diameter = radius * 2
            const cx = torch.x + Block.Width / 2 + rng.nextFloat() * 2 - 1
            const cy = torch.y + Block.Height / 2 + rng.nextFloat() * 2 - 1 + offsetY
            const gradient = lightContext.createRadialGradient(cx, cy, 0, cx, cy, radius)
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
            gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.5)')
            gradient.addColorStop(1, 'rgba(128, 255, 255, 0)')
            lightContext.fillStyle = gradient
            lightContext.fillRect(cx - radius, cy - radius, diameter, diameter)
        }

        this.renderTorches(lightContext, offsetY)
    }
}