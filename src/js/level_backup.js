"use strict";
// import Block        from './block.js'
// import Camera       from './camera.js'
// import Connection   from './connection.js'
// import Creeper      from './creeper.js'
// import Debris       from './debris.js'
// import LevelData    from './level_data.js'
// import Sounds       from './sounds.js'
// import Splatter     from './splatter.js'
// import Walker       from './walker.js'
// export default class Level {
//     static readonly GridEmpty       = 0xffff
//     static readonly GridWidth       = 640
//     static readonly GridHeight      = 360
//     static readonly GridCenterX     = Level.GridWidth / 2
//     static readonly GridCenterY     = Level.GridHeight / 2
//     static readonly BrickWidth      = 40
//     static readonly BrickHeight     = 30
//     static readonly CellCountX      = Level.GridWidth  / Block.Width
//     static readonly CellCountY      = Level.GridHeight / Block.Height
//     public blocks:          Block[]
//     public walkers:         Walker[]
//     public creepers:        Creeper[]
//     public indexGrid:       Uint16Array
//     public fallGrid:        Uint16Array
//     public fallFrame:       number
//     public removalIndex:    number
//     public splatters:       Splatter[]
//     public debris:          Debris[]
//     public camera:          Camera
//     public levelData:       LevelData
//     public deaths:          number
//     constructor(levelData: LevelData, camera: Camera) {
//         this.levelData      = levelData
//         this.blocks         = []
//         this.walkers        = []
//         this.creepers       = []
//         this.splatters      = []
//         this.debris         = []
//         this.indexGrid      = new Uint16Array(Level.GridWidth * Level.GridWidth).fill(Level.GridEmpty)
//         this.fallGrid       = new Uint16Array(Level.GridWidth * Level.GridWidth)
//         this.fallFrame      = 1
//         this.removalIndex   = -1
//         this.deaths         = 0
//         this.camera         = camera
//         this.load()
//     }
//     setIndex(grid: Uint16Array, x: number, y: number, index: number) {
//         grid[y * Level.GridWidth + x] = index
//     }
//     setIndices(grid: Uint16Array, x: number, y: number, w: number, h: number, index: number) {
//         for (let i = x; i < x + w; i++) {
//             for (let j = y; j < y + h; j++) {
//                 grid[j * Level.GridWidth + i] = index
//             }
//         }
//     }
//     getIndex(grid: Uint16Array, x: number, y: number) {
//         return grid[y * Level.GridWidth + x]
//     }
//     load() {
//         const charGrid = this.levelData.grid
//         const rowCount = charGrid.length
//         const colCount = charGrid[0].length
//         const newCharGrid: string[] = Array.from({ length: this.levelData.grid[0].length }, () => '')
//         for (let i = 0; i < colCount; i++) {
//             for (let j = 0; j < rowCount; j++) {
//                 newCharGrid[i] += charGrid[j][i]
//             }
//         }
//         const blockGrid: Block[][] = Array.from({ length: Level.CellCountX }, () => new Array(Level.CellCountY).fill(null))
//         // Initial block types
//         for (let i = 0; i < Level.CellCountX; i++) {
//             const cellX = i * 2
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const cellY     = j * 2
//                 const type      = Block.CharToType[newCharGrid[cellX][cellY]]
//                 if (type === Block.None) continue
//                 const x         = i * Block.Width
//                 const y         = j * Block.Height
//                 blockGrid[i][j] = new Block(x, y, type)
//             }
//         }
//         // Horizontal connections
//         for (let i = 0; i < Level.CellCountX - 1; i++) {
//             const cellX = i * 2 + 1
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const cellY = j * 2
//                 const type  = Connection.CharToConnection[newCharGrid[cellX][cellY]]
//                 const self  = blockGrid[i][j]
//                 const east  = blockGrid[i + 1][j]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections |= Connection.DirectionBits[Connection.East]
//                         east.softConnections |= Connection.DirectionBits[Connection.West]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections |= Connection.DirectionBits[Connection.East]
//                         east.hardConnections |= Connection.DirectionBits[Connection.West]
//                     break
//                 }
//             }
//         }
//         // Vertical connections
//         for (let i = 0; i < Level.CellCountX; i++) {
//             const cellX = i * 2
//             for (let j = 0; j < Level.CellCountY - 1; j++) {
//                 const cellY = j * 2 + 1
//                 const type  = Connection.CharToConnection[newCharGrid[cellX][cellY]]
//                 const self  = blockGrid[i][j]
//                 const south = blockGrid[i][j + 1]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections    |= Connection.DirectionBits[Connection.South]
//                         south.softConnections   |= Connection.DirectionBits[Connection.North]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections    |= Connection.DirectionBits[Connection.South]
//                         south.hardConnections   |= Connection.DirectionBits[Connection.North]
//                     break
//                 }
//             }
//         }
//         // Corner connections
//         for (let i = 0; i < Level.CellCountX - 1; i++) {
//             const cellX = i * 2 + 1
//             for (let j = 0; j < Level.CellCountY - 1; j++) {
//                 const cellY     = j * 2 + 1
//                 const type      = Connection.CharToConnection[newCharGrid[cellX][cellY]]
//                 const self      = blockGrid[i][j]
//                 const east      = blockGrid[i + 1][j]
//                 const south     = blockGrid[i][j + 1]
//                 const southeast = blockGrid[i + 1][j + 1]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections        |= Connection.DirectionBits[Connection.Southeast]
//                         east.softConnections        |= Connection.DirectionBits[Connection.Southwest]
//                         south.softConnections       |= Connection.DirectionBits[Connection.Northeast]
//                         southeast.softConnections   |= Connection.DirectionBits[Connection.Northwest]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections        |= Connection.DirectionBits[Connection.Southeast]
//                         east.hardConnections        |= Connection.DirectionBits[Connection.Southwest]
//                         south.hardConnections       |= Connection.DirectionBits[Connection.Northeast]
//                         southeast.hardConnections   |= Connection.DirectionBits[Connection.Northwest]
//                     break
//                 }
//             }
//         }
//         // Add to array
//         // Y-order of insertion is deliberate for proper movement
//         for (let i = 0; i < Level.CellCountX; i++) {
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const block = blockGrid[i][j] 
//                 if (block === null) continue
//                 this.blocks.push(block)
//             }
//         }
//         // Add to grid
//         for (let i = 0; i < this.blocks.length; i++) {
//             const block = this.blocks[i]
//             this.setIndices(this.indexGrid, block.x, block.y, Block.Width, Block.Height, i)
//         }
//         // Add walkers
//         for (const walkerData of this.levelData.walkerData) {
//             this.walkers.push(new Walker(walkerData[0], walkerData[1], walkerData[2]))
//         }
//         // Add creepers
//         for (const creeperData of this.levelData.creeperData) {
//             this.creepers.push(new Walker(creeperData[0], creeperData[1], creeperData[2]))
//         }
//         this.groundBlocks()
//     }
//     tap(gridX: number, gridY: number) {
//         if (this.fallFrame > 0) return
//         if (gridX < 0 || gridY < 0 || gridX >= Level.GridWidth || gridY >= Level.GridHeight) return
//         const index = this.getIndex(this.indexGrid, gridX, gridY)
//         if (index === Level.GridEmpty) return
//         const block = this.blocks[index]
//         if (!Block.TypeIsDestructible[block.type]) return
//         this.remove(index)
//         this.fallFrame = 1
//         Sounds.playBoom()
//     }
//     // // If fall frame === -1, allow for tap
//     // // If there is a successful removal, set fall frame to 0 (from -1)
//     // // 
//     groundedCount() {
//         let groundedCount = 0
//         for (const block of this.blocks) {
//             if (block.grounded) {
//                 groundedCount++
//             }
//         }
//         return groundedCount
//     }
//     update(frame: number) {
//         const livingWalkerCount     = this.walkers.length
//         const livingCreeperCount    = this.creepers.length
//         if (this.fallFrame > 0) {
//             this.groundBlocks()
//             const startGroundedCount    = this.groundedCount()
//             const shakeIntensity        = this.fallFrame * this.fallFrame * 0.001
//             for (let i = 0; i < this.fallFrame; i++) {
//                 this.groundWalkers()
//                 this.groundCreepers()
//                 this.measureWalkerFalls()
//                 this.killFallingWalkers()
//                 this.crushWalkers()
//                 this.crushCreepers()
//                 if (this.blocksGrounded() 
//                     && this.walkersGrounded()
//                     && this.creepersGrounded()) {
//                     this.fallFrame = 0
//                     break
//                 }
//                 this.fall()
//                 this.murder()
//                 this.killFallingWalkers()
//                 this.groundBlocks()
//             }
//             const endGroundedCount  = this.groundedCount()
//             const landedCount       = endGroundedCount - startGroundedCount
//             this.camera.shake(shakeIntensity * landedCount)
//             if (landedCount > 0) {
//                 Sounds.playThump()
//             }
//         }
//         if (this.fallFrame > 0) {
//             this.fallFrame++
//         }
//         if (frame % 2 === 0) {
//             this.walk()
//             this.creep()
//             this.murder()
//         }
//         const deadWalkerCount   = livingWalkerCount - this.walkers.length
//         const deadCreeperCount  = livingCreeperCount - this.creepers.length
//         const deadCount         = deadWalkerCount + deadCreeperCount
//         for (let i = 0; i < deadCount; i++) {
//             Sounds.playSplat()
//         }
//         this.updateSplatters()
//         this.updateDebris()
//     }
//     complete() {
//         return this.walkers.length === 0 && this.deaths === 0
//     }
//     murder() {
//         for (const creeper of this.creepers) {
//             for (const walker of this.walkers) {
//                 if (this.contact(creeper, walker)) {
//                     this.splatterWalker(walker, 1)
//                     walker.murdered = true
//                 }
//             }
//         }
//         const alive = []
//         for (const walker of this.walkers) {
//             if (!walker.murdered) {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     contact(creeper: Creeper, walker: Walker) {
//         return !(creeper.x + Creeper.Width <= walker.x
//                 || walker.x + Walker.Width <= creeper.x 
//                 || creeper.y + Creeper.Height <= walker.y 
//                 || walker.y + Walker.Height <= creeper.y)
//     }
//     walk() {
//         let initialWalkerCount = this.walkers.length
//         for (const walker of this.walkers) {
//             if (!walker.grounded) continue
//             // If walker is on edge, set direction
//             const floorY            = walker.y + Walker.Height
//             const eastFloorX        = walker.x + Walker.Width - 1
//             const westFloorX        = walker.x
//             const eastFloorIndex    = this.getIndex(this.indexGrid, eastFloorX, floorY)
//             const westFloorIndex    = this.getIndex(this.indexGrid, westFloorX, floorY)
//             if (eastFloorIndex === Level.GridEmpty) {
//                 walker.direction = -1
//             } else if (westFloorIndex === Level.GridEmpty) {
//                 walker.direction = 1
//             }
//             const footY                 = floorY - 1
//             if (walker.direction === 1) {
//                 const eastFootX         = eastFloorX + 1
//                 const eastFootIndex     = this.getIndex(this.indexGrid, eastFootX, footY)
//                 if (eastFootIndex !== Level.GridEmpty) {
//                     const eastFootBlock = this.blocks[eastFootIndex]
//                     if (eastFootBlock.type === Block.Goal) {
//                         walker.saved    = true
//                         continue
//                     }
//                     walker.direction    = -1
//                 }
//             } else {
//                 const westFootX         = westFloorX - 1
//                 const westFootIndex     = this.getIndex(this.indexGrid, westFootX, footY)
//                 if (westFootIndex !== Level.GridEmpty) {
//                     walker.direction    = 1
//                     const eastFootBlock = this.blocks[westFootIndex]
//                     if (eastFootBlock.type === Block.Goal) {
//                         walker.saved    = true
//                         continue
//                     }
//                 }
//             }
//             walker.x += walker.direction
//         }
//         this.walkers = this.walkers.filter(walker => !walker.saved)
//         if (initialWalkerCount > this.walkers.length) {
//             Sounds.playVanish()
//         }
//     }
//     creep() {
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) continue
//             // If walker is on edge, set direction
//             const floorY            = creeper.y + Creeper.Height
//             const eastFloorX        = creeper.x + Creeper.Width - 1
//             const westFloorX        = creeper.x
//             const eastFloorIndex    = this.getIndex(this.indexGrid, eastFloorX, floorY)
//             const westFloorIndex    = this.getIndex(this.indexGrid, westFloorX, floorY)
//             if (eastFloorIndex === Level.GridEmpty) {
//                 creeper.direction = -1
//             } else if (westFloorIndex === Level.GridEmpty) {
//                 creeper.direction = 1
//             }
//             const footY                 = floorY - 1
//             if (creeper.direction === 1) {
//                 const eastFootX         = eastFloorX + 1
//                 const eastFootIndex     = this.getIndex(this.indexGrid, eastFootX, footY)
//                 if (eastFootIndex !== Level.GridEmpty) {
//                     creeper.direction    = -1
//                 }
//             } else {
//                 const westFootX         = westFloorX - 1
//                 const westFootIndex     = this.getIndex(this.indexGrid, westFootX, footY)
//                 if (westFootIndex !== Level.GridEmpty) {
//                     creeper.direction    = 1
//                 }
//             }
//             creeper.x += creeper.direction
//         }
//     }
//     walkerCrushed(walker: Walker) {
//         if (!walker.grounded) return false
//         if (this.getIndex(this.indexGrid, walker.x + Walker.Width - 1, walker.y) !== Level.GridEmpty) return true
//         if (this.getIndex(this.indexGrid, walker.x, walker.y) !== Level.GridEmpty) return true
//         return false
//     }
//     creeperCrushed(creeper: Creeper) {
//         if (!creeper.grounded) return false
//         if (this.getIndex(this.indexGrid, creeper.x + Creeper.Width - 1, creeper.y) !== Level.GridEmpty) return true
//         if (this.getIndex(this.indexGrid, creeper.x, creeper.y) !== Level.GridEmpty) return true
//         return false
//     }
//     walkerKilledByFall(walker: Walker) {
//         return walker.fallStop - walker.fallStart > 30
//     }
//     crushWalkers() {
//         const alive = []
//         for (const walker of this.walkers) {
//             if (this.walkerCrushed(walker)) {
//                 this.splatterWalker(walker, 3)
//             } else {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     crushCreepers() {
//         const alive = []
//         for (const creeper of this.creepers) {
//             if (this.creeperCrushed(creeper)) {
//                 this.splatterCreeper(creeper, 3)
//             } else {
//                 alive.push(creeper)
//             }
//         }
//         this.creepers = alive
//     }
//     killFallingWalkers() {
//         const alive = []
//         for (const walker of this.walkers) {
//             if (this.walkerKilledByFall(walker)) {
//                 this.splatterWalker(walker, 1)
//             } else {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     splatterWalker(walker: Walker, vyScalar: number) {
//         this.deaths++
//         const count = Splatter.CountMinimum + Math.floor(Splatter.CountMaximum - Splatter.CountMinimum)
//         const x     = walker.x + Walker.Width / 2
//         const y     = walker.y + Walker.Height
//         for (let i = 0; i < count; i++) {
//             this.splatters.push(new Splatter(x, y, vyScalar))
//         }
//     }
//     splatterCreeper(creeper: Creeper, vyScalar: number) {
//         const count = Splatter.CountMinimum + Math.floor(Splatter.CountMaximum - Splatter.CountMinimum)
//         const x     = creeper.x + Creeper.Width / 2
//         const y     = creeper.y + Creeper.Height
//         for (let i = 0; i < count; i++) {
//             this.splatters.push(new Splatter(x, y, vyScalar))
//         }
//     }
//     updateDebris() {
//         for (const debris of this.debris) {
//             debris.vy   += Debris.FallSpeed
//             debris.x    += debris.vx
//             debris.y    += debris.vy
//             debris.frame++
//         }
//         this.debris = this.debris.filter(debris => debris.y < Level.GridHeight)
//     }
//     updateSplatters() {
//         for (const splatter of this.splatters) {
//             splatter.vy += Splatter.FallSpeed
//             splatter.x  += splatter.vx
//             splatter.y  += splatter.vy
//             const x     = Math.floor(splatter.x)
//             const y     = Math.floor(splatter.y)
//             if (x < 0 || y < 0 || x >= Level.GridWidth || y > Level.GridHeight) continue
//             const index = this.getIndex(this.indexGrid, x, y)
//             if (index !== Level.GridEmpty && Math.random() > 0.5) {
//                 splatter.splattered = true
//                 const block         = this.blocks[index]
//                 const blockX        = x - block.x
//                 const blockY        = y - block.y
//                 splatter.x          = blockX
//                 splatter.y          = blockY
//                 block.splatters.push(splatter)
//             }
//         }
//         this.splatters = this.splatters.filter(splatter => splatter.y < Level.GridHeight && !splatter.splattered)
//     }
//     remove(index: number) {
//         // Prevents recursion into deleted blocks
//         if (index === Level.GridEmpty) return
//         const block = this.blocks[index]
//         const x     = block.x
//         const y     = block.y
//         if (index !== this.blocks.length - 1) {
//             const lastBlock = this.blocks[this.blocks.length - 1]
//             this.blocks[index] = lastBlock
//             this.setIndices(this.indexGrid, lastBlock.x, lastBlock.y, Block.Width, Block.Height, index)
//         }
//         this.blocks.length--
//         this.setIndices(this.indexGrid, block.x, block.y, Block.Width, Block.Height, Level.GridEmpty)
//         // Remove direct soft connections
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             if ((block.softConnections & Connection.DirectionBits[i]) === 0) continue
//             const softConnectionVector  = Connection.DirectionVectors[i]
//             const softConnectionX       = x + Block.Width * softConnectionVector.dx
//             const softConnectionY       = y + Block.Height * softConnectionVector.dy
//             const softConnectionIndex   = this.getIndex(this.indexGrid, softConnectionX, softConnectionY)
//             const softConnectionBlock   = this.blocks[softConnectionIndex]
//             const oppositeDirection     = Connection.OppositeDirections[i]
//             const oppositeDirectionBit  = Connection.DirectionBits[oppositeDirection]
//             softConnectionBlock.softConnections &= ~oppositeDirectionBit
//         }
//         // Cache cardinal directions
//         const softCardinalConnection = new Array(Connection.CardinalDirectionCount).fill(false)
//         for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
//             const directionBit = Connection.DirectionBits[i]
//             softCardinalConnection[i] = (block.softConnections & directionBit) === directionBit
//         }
//         // Remove adjacent diagonal soft connections
//         for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
//             const directionA        = i
//             if (!softCardinalConnection[directionA]) continue
//             const directionB        = (i + 1) % Connection.CardinalDirectionCount
//             if (!softCardinalConnection[directionB]) continue
//             const vectorA           = Connection.DirectionVectors[directionA]
//             const vectorB           = Connection.DirectionVectors[directionB]
//             const xA                = x + vectorA.dx * Block.Width
//             const xB                = x + vectorB.dx * Block.Width
//             const yA                = y + vectorA.dy * Block.Height
//             const yB                = y + vectorB.dy * Block.Height
//             const indexA            = this.getIndex(this.indexGrid, xA, yA)
//             const indexB            = this.getIndex(this.indexGrid, xB, yB)
//             const blockA            = this.blocks[indexA]
//             const blockB            = this.blocks[indexB]
//             const diagonalA         = (directionA + 1) % 4 + 4
//             const diagonalB         = (directionB + 2) % 4 + 4
//             // (0, 1) -> (5, 7) or [1, 3]
//             // (1, 2) -> (6, 4) or [2, 0]
//             // (2, 3) -> (7, 5) or [3, 1]
//             // (3, 0) -> (4, 6) or [0, 2]
//             blockA.softConnections  &= ~Connection.DirectionBits[diagonalA]
//             blockB.softConnections  &= ~Connection.DirectionBits[diagonalB]
//         }
//         // Propagate removal to all hard connections
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             const directionBit          = Connection.DirectionBits[i]
//             const hardConnection        = (block.hardConnections & directionBit) === directionBit
//             if (!hardConnection) continue
//             const hardConnectionVector  = Connection.DirectionVectors[i]
//             const hardConnectionX       = x + Block.Width * hardConnectionVector.dx
//             const hardConnectionY       = y + Block.Height * hardConnectionVector.dy
//             const hardConnectionIndex   = this.getIndex(this.indexGrid, hardConnectionX, hardConnectionY)
//             this.remove(hardConnectionIndex)
//         }
//         const debrisCount = Math.floor(Debris.CountMinimum + Math.random() * (Debris.CountMaximum - Debris.CountMinimum))
//         for (let i = 0; i < debrisCount; i++) {
//             this.debris.push(new Debris(block))
//         }
//     }
//     fall() {
//         this.fallGrid.fill(Level.GridEmpty)
//         for (let i = 0; i < this.blocks.length; i++) {
//             const block = this.blocks[i]
//             if (block.grounded) continue
//             this.setIndices(this.indexGrid, block.x, block.y, Block.Width, Block.Height, Level.GridEmpty)
//             block.y++
//             this.setIndices(this.fallGrid, block.x, block.y, Block.Width, Block.Height, i)
//         }
//         for (let i = 0; i < this.fallGrid.length; i++) {
//             const index = this.fallGrid[i] 
//             if (index === Level.GridEmpty) continue
//             this.indexGrid[i] = index
//         }
//         for (const walker of this.walkers) {
//             if (!walker.grounded) {
//                 walker.y++
//             }
//         }
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) {
//                 creeper.y++
//             }
//         }
//     }
//     walkersGrounded() {
//         for (const walker of this.walkers) {
//             if (!walker.grounded) return false
//         }
//         return true
//     }
//     creepersGrounded() {
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) return false
//         }
//         return true
//     }
//     groundWalkers() {
//         for (const walker of this.walkers) {
//             const y         = walker.y + Walker.Height
//             const xEast     = walker.x + Walker.Width - 1
//             const indexEast = this.getIndex(this.indexGrid, xEast, y)
//             if (indexEast !== Level.GridEmpty && this.blocks[indexEast].grounded) {
//                 walker.grounded = true
//                 continue
//             }
//             const xWest     = walker.x
//             const indexWest = this.getIndex(this.indexGrid, xWest, y)
//             if (indexWest !== Level.GridEmpty && this.blocks[indexWest].grounded) {
//                 walker.grounded = true
//                 continue
//             }
//             walker.grounded = false
//         }
//     }
//     groundCreepers() {
//         for (const creeper of this.creepers) {
//             const y         = creeper.y + Creeper.Height
//             const xEast     = creeper.x + Creeper.Width - 1
//             const indexEast = this.getIndex(this.indexGrid, xEast, y)
//             if (indexEast !== Level.GridEmpty && this.blocks[indexEast].grounded) {
//                 creeper.grounded = true
//                 continue
//             }
//             const xWest     = creeper.x
//             const indexWest = this.getIndex(this.indexGrid, xWest, y)
//             if (indexWest !== Level.GridEmpty && this.blocks[indexWest].grounded) {
//                 creeper.grounded = true
//                 continue
//             }
//             creeper.grounded = false
//         }
//     }
//     measureWalkerFalls() {
//         for (const walker of this.walkers) {
//             if (walker.falling) {
//                 if (walker.grounded) {
//                     walker.falling = false
//                     walker.fallStop = walker.y
//                 }
//             } else {
//                 if (!walker.grounded) {
//                     walker.falling = true
//                     walker.fallStart = walker.y
//                 }
//             }
//         }
//     }
//     blocksGrounded() {
//         for (const block of this.blocks) {
//             if (!block.grounded) return false
//         }
//         return true
//     }
//     groundBlocks() {
//         for (const block of this.blocks) {
//             block.grounded = false
//         }
//         for (const block of this.blocks) {
//             if (Block.TypeFalls[block.type]) continue
//             this.groundBlock(block)
//         }
//     }
//     groundBlock(block: Block) {
//         if (block.grounded) return
//         block.grounded = true
//         // Ground block above
//         if (block.y > 0) {
//             const index = this.getIndex(this.indexGrid, block.x, block.y - 1)
//             if (index !== Level.GridEmpty) {
//                 this.groundBlock(this.blocks[index])
//             }
//         }
//         // Ground connected blocks
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             const directionBit      = Connection.DirectionBits[i]
//             const hardConnection    = (block.hardConnections & directionBit) === directionBit
//             const softConnection    = (block.softConnections & directionBit) === directionBit
//             if (!hardConnection && !softConnection) continue
//             const connectionVector  = Connection.DirectionVectors[i]
//             const connectionX       = block.x + connectionVector.dx * Block.Width
//             const connectionY       = block.y + connectionVector.dy * Block.Height
//             const connectionIndex   = this.getIndex(this.indexGrid, connectionX, connectionY)
//             const connectionBlock   = this.blocks[connectionIndex]
//             this.groundBlock(connectionBlock)
//         }
//     }
// }
// import Block        from './block.js'
// import Camera       from './camera.js'
// import Connection   from './connection.js'
// import Creeper      from './creeper.js'
// import Debris       from './debris.js'
// import Faller from './faller.js'
// import LevelData    from './level_data.js'
// import Sounds       from './sounds.js'
// import Splatter     from './splatter.js'
// import Walker       from './walker.js'
// export default class Level {
//     // On each frame
//     // Calculate falls
//     static readonly GridEmpty       = 0xffff
//     static readonly GridWidth       = 640
//     static readonly GridHeight      = 360
//     static readonly GridCenterX     = Level.GridWidth / 2
//     static readonly GridCenterY     = Level.GridHeight / 2
//     static readonly BrickWidth      = 40
//     static readonly BrickHeight     = 30
//     static readonly CellCountX      = Level.GridWidth  / Block.Width
//     static readonly CellCountY      = Level.GridHeight / Block.Height
//     public blocks:          Block[]
//     public walkers:         Walker[]
//     public creepers:        Creeper[]
//     public indexGrid:       Uint16Array
//     public removalIndex:    number
//     public splatters:       Splatter[]
//     public debris:          Debris[]
//     public camera:          Camera
//     public levelData:       LevelData
//     public deaths:          number
//     constructor(levelData: LevelData, camera: Camera) {
//         this.levelData      = levelData
//         this.blocks         = []
//         this.walkers        = []
//         this.creepers       = []
//         this.splatters      = []
//         this.debris         = []
//         this.indexGrid      = new Uint16Array(Level.GridWidth * Level.GridWidth).fill(Level.GridEmpty)
//         this.removalIndex   = -1
//         this.deaths         = 0
//         this.camera         = camera
//         this.load()
//     }
//     setIndex(x: number, y: number, index: number) {
//         this.indexGrid[y * Level.GridWidth + x] = index
//     }
//     setIndices(x: number, y: number, w: number, h: number, index: number) {
//         for (let i = x; i < x + w; i++) {
//             for (let j = y; j < y + h; j++) {
//                 this.indexGrid[j * Level.GridWidth + i] = index
//             }
//         }
//     }
//     getIndex(x: number, y: number) {
//         return this.indexGrid[y * Level.GridWidth + x]
//     }
//     load() {
//         const charGrid = this.levelData.grid
//         const rowCount = charGrid.length
//         const colCount = charGrid[0].length
//         const newCharGrid: string[] = Array.from({ length: this.levelData.grid[0].length }, () => '')
//         for (let i = 0; i < colCount; i++) {
//             for (let j = 0; j < rowCount; j++) {
//                 newCharGrid[i] += charGrid[j][i]
//             }
//         }
//         const blockGrid: Block[][] = Array.from({ length: Level.CellCountX }, () => new Array(Level.CellCountY).fill(null))
//         // Initial block types
//         for (let i = 0; i < Level.CellCountX; i++) {
//             const cellX = i * 2
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const cellY     = j * 2
//                 const type      = Block.CharToType[newCharGrid[cellX][cellY]]
//                 if (type === Block.None) continue
//                 const x         = i * Block.Width
//                 const y         = j * Block.Height
//                 blockGrid[i][j] = new Block(x, y, type)
//             }
//         }
//         // Horizontal connections
//         for (let i = 0; i < Level.CellCountX - 1; i++) {
//             const cellX = i * 2 + 1
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const cellY = j * 2
//                 const type  = Connection.CharToConnection[newCharGrid[cellX][cellY]]
//                 const self  = blockGrid[i][j]
//                 const east  = blockGrid[i + 1][j]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections |= Connection.DirectionBits[Connection.East]
//                         east.softConnections |= Connection.DirectionBits[Connection.West]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections |= Connection.DirectionBits[Connection.East]
//                         east.hardConnections |= Connection.DirectionBits[Connection.West]
//                     break
//                 }
//             }
//         }
//         // Vertical connections
//         for (let i = 0; i < Level.CellCountX; i++) {
//             const cellX = i * 2
//             for (let j = 0; j < Level.CellCountY - 1; j++) {
//                 const cellY = j * 2 + 1
//                 const type  = Connection.CharToConnection[newCharGrid[cellX][cellY]]
//                 const self  = blockGrid[i][j]
//                 const south = blockGrid[i][j + 1]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections    |= Connection.DirectionBits[Connection.South]
//                         south.softConnections   |= Connection.DirectionBits[Connection.North]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections    |= Connection.DirectionBits[Connection.South]
//                         south.hardConnections   |= Connection.DirectionBits[Connection.North]
//                     break
//                 }
//             }
//         }
//         // Corner connections
//         for (let i = 0; i < Level.CellCountX - 1; i++) {
//             const cellX = i * 2 + 1
//             for (let j = 0; j < Level.CellCountY - 1; j++) {
//                 const cellY     = j * 2 + 1
//                 const type      = Connection.CharToConnection[newCharGrid[cellX][cellY]]
//                 const self      = blockGrid[i][j]
//                 const east      = blockGrid[i + 1][j]
//                 const south     = blockGrid[i][j + 1]
//                 const southeast = blockGrid[i + 1][j + 1]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections        |= Connection.DirectionBits[Connection.Southeast]
//                         east.softConnections        |= Connection.DirectionBits[Connection.Southwest]
//                         south.softConnections       |= Connection.DirectionBits[Connection.Northeast]
//                         southeast.softConnections   |= Connection.DirectionBits[Connection.Northwest]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections        |= Connection.DirectionBits[Connection.Southeast]
//                         east.hardConnections        |= Connection.DirectionBits[Connection.Southwest]
//                         south.hardConnections       |= Connection.DirectionBits[Connection.Northeast]
//                         southeast.hardConnections   |= Connection.DirectionBits[Connection.Northwest]
//                     break
//                 }
//             }
//         }
//         // Add to array
//         // Y-order of insertion is deliberate for proper movement
//         for (let i = 0; i < Level.CellCountX; i++) {
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const block = blockGrid[i][j] 
//                 if (block === null) continue
//                 this.blocks.push(block)
//             }
//         }
//         // Add to grid
//         for (let i = 0; i < this.blocks.length; i++) {
//             const block = this.blocks[i]
//             this.setIndices(block.x, block.y, Block.Width, Block.Height, i)
//         }
//         // Add walkers
//         for (const walkerData of this.levelData.walkerData) {
//             this.walkers.push(new Walker(walkerData[0], walkerData[1], walkerData[2]))
//         }
//         // Add creepers
//         for (const creeperData of this.levelData.creeperData) {
//             this.creepers.push(new Walker(creeperData[0], creeperData[1], creeperData[2]))
//         }
//         this.groundBlocks()
//     }
//     tap(gridX: number, gridY: number) {
//         if (gridX < 0 || gridY < 0 || gridX >= Level.GridWidth || gridY >= Level.GridHeight) return
//         const index = this.getIndex(gridX, gridY)
//         if (index === Level.GridEmpty) return
//         const block = this.blocks[index]
//         if (!Block.TypeIsDestructible[block.type]) return
//         this.remove(index)
//         Sounds.playBoom()
//     }
//     // // If fall frame === -1, allow for tap
//     // // If there is a successful removal, set fall frame to 0 (from -1)
//     // // 
//     groundedCount() {
//         let groundedCount = 0
//         for (const block of this.blocks) {
//             if (block.grounded) {
//                 groundedCount++
//             }
//         }
//         return groundedCount
//     }
//     update(frame: number) {
//         // Ground stationary blocks, blocks connected to stationary blocks, and blocks above stationary blocks
//         //  with a |vy| less than some value, for example 1 or 0.5
//         this.groundBlocks()
//         // Increment vy for ungrounded blocks
//         this.accelerateUngroundedBlocks()
//         // Fall
//         // Set initial steps for all objects
//         this.walkers.forEach(walker => walker.setSteps())
//         this.creepers.forEach(creeper => creeper.setSteps())
//         this.blocks.forEach(block => block.setSteps())
//         // Complete movements, starting at t=0 until no valid movements remain
//         let step                        = 0
//         let stepCount                   = 1
//         let blockStepping: boolean[]    = []
//         let walkerStepping: boolean[]   = []
//         let creeperStepping: boolean[]  = []
//         while (true) {
//             // Find lowest time greater than or equal to current time
//             let nextStep        = 1
//             let nextStepCount   = 1
//             function lessThan(num1: number, den1: number, num2: number, den2: number) {
//                 return num1 * den2 < num2 * den1
//             }
//             function equals(num1: number, den1: number, num2: number, den2: number) {
//                 return num1 * den2 === num2 * den1
//             }
//             function updateNextStep(fallers: Faller[]) {
//                 for (const faller of fallers) {
//                     if (lessThan(faller.step, faller.stepCount, nextStep, nextStepCount) 
//                         && !lessThan(faller.step, faller.stepCount, step, stepCount)) {
//                         nextStep        = faller.step
//                         nextStepCount   = faller.stepCount
//                     }
//                 }
//             }
//             function setStepping(fallers: Faller[], stepping: boolean[]) {
//                 for (let i = 0; i < fallers.length; i++) {
//                     const faller = fallers[i]
//                     stepping[i] = equals(faller.step, faller.stepCount, step, stepCount)
//                 }
//             }
//             updateNextStep(this.blocks)
//             updateNextStep(this.walkers)
//             updateNextStep(this.creepers)
//             // If next step greater than 1, falls are complete
//             if (lessThan(1, 1, nextStep, nextStepCount)) break
//             // Update step
//             let step        = nextStep
//             let stepCount   = nextStepCount
//             // Populate falling arrays
//             setStepping(this.blocks, blockStepping)
//             setStepping(this.walkers, walkerStepping)
//             setStepping(this.creepers, creeperStepping)
//             //  Movement and collisions
//             //  For the current movement frame
//             //      Determine if there are block-block collisions
//             //      Block-block collision can occur when
//             //          A block stepping now moves into non-moving block
//             //          A block stepping now moves into another block stepping now
//             //          A block stepping now moves into the same spot as a block stepping now
//             //  Limit possible colliders to highest step count blocks in current movement
//             //  Ignore double movements
//             //  Prioritize downward over upward collisions? Or higher differential?
//             let sign    = 0
//             let speed   = 0
//             //  If speed remains zero, no collision, just movements
//             //  Falling blocks go first
//             // Falling blocks
//             for (let i = 0; i < this.blocks.length; i++) {
//                 if (!blockStepping[i]) continue
//                 const block = this.blocks[i]
//                 if (block.vy > 0) {
//                     let downIndex   = this.getIndex(block.x, block.y + Block.Height)
//                     if (downIndex === Level.GridEmpty) continue
//                     if (block.stepCount > speed) {
//                         speed = block.stepCount
//                     }
//                 }
//             }
//             //  Rising blocks
//             for (let i = 0; i < this.blocks.length; i++) {
//                 if (!blockStepping[i]) continue
//                 const block = this.blocks[i]
//                 if (block.vy < 0) {
//                     let upIndex = this.getIndex(block.x, block.y - 1)
//                     if (upIndex === Level.GridEmpty) continue
//                     if (block.stepCount > speed) {
//                         speed = block.stepCount
//                     }
//                 }
//             }
//             //      If no block-block collisions
//             //          Move blocks
//             //      Otherwise
//             //          Find highest collision differential
//             //          Find all collisions with highest differential
//             //  Find masses of colliding bodies
//             //      Connected blocks + blocks moving at same speed behind connected bodies
//             //      Blocks opposing moving blocks of velocity yielding highest differential
//             //      Solve for collision with summed masses
//             //      Update velocities for blocks involved
//             //      Recalculate steps and stepCounts
//             //      Do not move blocks
//             //  If no block-block collision in move, move and push/update walker/creeper vy
//             //  Ensure that resultant velocities are always integral
//             //  Attempt to move walkers/creepers
//             //  If collision with blocks
//             //      Do not move, update vy, step, and stepCount
//             //  If walker-creeper collision after move
//             //      Kill walker
//         }
//         // Block-block collisions
//         // Block-walker and block-creeper collisions
//         // Walker creeper collisions
//         // Walk
//         // Walk if on 1 fully grounded blocks
//         // Create a list of falls
//         // These falls are ordered in time
//         // Keep track of the current time (rational on the range (0, 1])
//         // Check each object to find the next move
//         // When next move is found, perform move
//         // Blocks check against blocks and creatures
//         // Creatures check against blocks and creatures
//         let currentStepTime = 0
//         while (true) {
//             let fallers: Faller[] = []
//             let nextStepTime = 1
//             function nextStep(faller: Faller) {
//                 if (faller.vyStepsTaken === faller.vySteps) return
//                 const fallerStepTime = faller.vyStepsTaken / faller.vySteps
//                 if (fallerStepTime < nextStepTime) {
//                     nextStepTime = fallerStepTime
//                     fallers.push(faller)
//                 }
//             }
//             for (const walker of this.walkers) {
//                 nextStep(walker)
//             }
//             for (const creeper of this.creepers) {
//                 nextStep(creeper)
//             }
//             for (const block of this.blocks) {
//                 nextStep(block)
//             }
//             if (fallers.length === 0) break
//             currentStepTime = nextStepTime
//             for (const faller of fallers) {
//             }
//         }
//         // this.groundWalkers()
//         // this.groundCreepers()
//         // this.measureWalkerFalls()
//         // this.killFallingWalkers()
//         // this.crushWalkers()
//         // this.crushCreepers()
//         // this.fall()
//         // this.murder()
//         // this.killFallingWalkers()
//         // this.groundBlocks()
//         // const endGroundedCount  = this.groundedCount()
//         // const landedCount       = endGroundedCount - startGroundedCount
//         // this.camera.shake(shakeIntensity * landedCount)
//         // if (landedCount > 0) {
//         //     Sounds.playThump()
//         // }
//         // if (frame % 2 === 0) {
//         //     this.walk()
//         //     this.creep()
//         //     this.murder()
//         // }
//         // const deadWalkerCount   = livingWalkerCount - this.walkers.length
//         // const deadCreeperCount  = livingCreeperCount - this.creepers.length
//         // const deadCount         = deadWalkerCount + deadCreeperCount
//         // for (let i = 0; i < deadCount; i++) {
//         //     Sounds.playSplat()
//         // }
//         // this.updateSplatters()
//         // this.updateDebris()
//     }
//     complete() {
//         return this.walkers.length === 0 && this.deaths === 0
//     }
//     murder() {
//         for (const creeper of this.creepers) {
//             for (const walker of this.walkers) {
//                 if (this.contact(creeper, walker)) {
//                     this.splatterWalker(walker, 1)
//                     walker.murdered = true
//                 }
//             }
//         }
//         const alive = []
//         for (const walker of this.walkers) {
//             if (!walker.murdered) {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     contact(creeper: Creeper, walker: Walker) {
//         return !(creeper.x + Creeper.Width <= walker.x
//                 || walker.x + Walker.Width <= creeper.x 
//                 || creeper.y + Creeper.Height <= walker.y 
//                 || walker.y + Walker.Height <= creeper.y)
//     }
//     walk() {
//         let initialWalkerCount = this.walkers.length
//         for (const walker of this.walkers) {
//             if (!walker.grounded) continue
//             // If walker is on edge, set direction
//             const floorY            = walker.y + Walker.Height
//             const eastFloorX        = walker.x + Walker.Width - 1
//             const westFloorX        = walker.x
//             const eastFloorIndex    = this.getIndex(this.indexGrid, eastFloorX, floorY)
//             const westFloorIndex    = this.getIndex(this.indexGrid, westFloorX, floorY)
//             if (eastFloorIndex === Level.GridEmpty) {
//                 walker.direction = -1
//             } else if (westFloorIndex === Level.GridEmpty) {
//                 walker.direction = 1
//             }
//             const footY                 = floorY - 1
//             if (walker.direction === 1) {
//                 const eastFootX         = eastFloorX + 1
//                 const eastFootIndex     = this.getIndex(this.indexGrid, eastFootX, footY)
//                 if (eastFootIndex !== Level.GridEmpty) {
//                     const eastFootBlock = this.blocks[eastFootIndex]
//                     if (eastFootBlock.type === Block.Goal) {
//                         walker.saved    = true
//                         continue
//                     }
//                     walker.direction    = -1
//                 }
//             } else {
//                 const westFootX         = westFloorX - 1
//                 const westFootIndex     = this.getIndex(this.indexGrid, westFootX, footY)
//                 if (westFootIndex !== Level.GridEmpty) {
//                     walker.direction    = 1
//                     const eastFootBlock = this.blocks[westFootIndex]
//                     if (eastFootBlock.type === Block.Goal) {
//                         walker.saved    = true
//                         continue
//                     }
//                 }
//             }
//             walker.x += walker.direction
//         }
//         this.walkers = this.walkers.filter(walker => !walker.saved)
//         if (initialWalkerCount > this.walkers.length) {
//             Sounds.playVanish()
//         }
//     }
//     creep() {
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) continue
//             // If walker is on edge, set direction
//             const floorY            = creeper.y + Creeper.Height
//             const eastFloorX        = creeper.x + Creeper.Width - 1
//             const westFloorX        = creeper.x
//             const eastFloorIndex    = this.getIndex(this.indexGrid, eastFloorX, floorY)
//             const westFloorIndex    = this.getIndex(this.indexGrid, westFloorX, floorY)
//             if (eastFloorIndex === Level.GridEmpty) {
//                 creeper.direction = -1
//             } else if (westFloorIndex === Level.GridEmpty) {
//                 creeper.direction = 1
//             }
//             const footY                 = floorY - 1
//             if (creeper.direction === 1) {
//                 const eastFootX         = eastFloorX + 1
//                 const eastFootIndex     = this.getIndex(this.indexGrid, eastFootX, footY)
//                 if (eastFootIndex !== Level.GridEmpty) {
//                     creeper.direction    = -1
//                 }
//             } else {
//                 const westFootX         = westFloorX - 1
//                 const westFootIndex     = this.getIndex(this.indexGrid, westFootX, footY)
//                 if (westFootIndex !== Level.GridEmpty) {
//                     creeper.direction    = 1
//                 }
//             }
//             creeper.x += creeper.direction
//         }
//     }
//     walkerCrushed(walker: Walker) {
//         if (!walker.grounded) return false
//         if (this.getIndex(this.indexGrid, walker.x + Walker.Width - 1, walker.y) !== Level.GridEmpty) return true
//         if (this.getIndex(this.indexGrid, walker.x, walker.y) !== Level.GridEmpty) return true
//         return false
//     }
//     creeperCrushed(creeper: Creeper) {
//         if (!creeper.grounded) return false
//         if (this.getIndex(this.indexGrid, creeper.x + Creeper.Width - 1, creeper.y) !== Level.GridEmpty) return true
//         if (this.getIndex(this.indexGrid, creeper.x, creeper.y) !== Level.GridEmpty) return true
//         return false
//     }
//     walkerKilledByFall(walker: Walker) {
//         return walker.fallStop - walker.fallStart > 30
//     }
//     crushWalkers() {
//         const alive = []
//         for (const walker of this.walkers) {
//             if (this.walkerCrushed(walker)) {
//                 this.splatterWalker(walker, 3)
//             } else {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     crushCreepers() {
//         const alive = []
//         for (const creeper of this.creepers) {
//             if (this.creeperCrushed(creeper)) {
//                 this.splatterCreeper(creeper, 3)
//             } else {
//                 alive.push(creeper)
//             }
//         }
//         this.creepers = alive
//     }
//     killFallingWalkers() {
//         const alive = []
//         for (const walker of this.walkers) {
//             if (this.walkerKilledByFall(walker)) {
//                 this.splatterWalker(walker, 1)
//             } else {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     splatterWalker(walker: Walker, vyScalar: number) {
//         this.deaths++
//         const count = Splatter.CountMinimum + Math.floor(Splatter.CountMaximum - Splatter.CountMinimum)
//         const x     = walker.x + Walker.Width / 2
//         const y     = walker.y + Walker.Height
//         for (let i = 0; i < count; i++) {
//             this.splatters.push(new Splatter(x, y, vyScalar))
//         }
//     }
//     splatterCreeper(creeper: Creeper, vyScalar: number) {
//         const count = Splatter.CountMinimum + Math.floor(Splatter.CountMaximum - Splatter.CountMinimum)
//         const x     = creeper.x + Creeper.Width / 2
//         const y     = creeper.y + Creeper.Height
//         for (let i = 0; i < count; i++) {
//             this.splatters.push(new Splatter(x, y, vyScalar))
//         }
//     }
//     updateDebris() {
//         for (const debris of this.debris) {
//             debris.vy   += Debris.FallSpeed
//             debris.x    += debris.vx
//             debris.y    += debris.vy
//             debris.frame++
//         }
//         this.debris = this.debris.filter(debris => debris.y < Level.GridHeight)
//     }
//     updateSplatters() {
//         for (const splatter of this.splatters) {
//             splatter.vy += Splatter.FallSpeed
//             splatter.x  += splatter.vx
//             splatter.y  += splatter.vy
//             const x     = Math.floor(splatter.x)
//             const y     = Math.floor(splatter.y)
//             if (x < 0 || y < 0 || x >= Level.GridWidth || y > Level.GridHeight) continue
//             const index = this.getIndex(this.indexGrid, x, y)
//             if (index !== Level.GridEmpty && Math.random() > 0.5) {
//                 splatter.splattered = true
//                 const block         = this.blocks[index]
//                 const blockX        = x - block.x
//                 const blockY        = y - block.y
//                 splatter.x          = blockX
//                 splatter.y          = blockY
//                 block.splatters.push(splatter)
//             }
//         }
//         this.splatters = this.splatters.filter(splatter => splatter.y < Level.GridHeight && !splatter.splattered)
//     }
//     remove(index: number) {
//         // Prevents recursion into deleted blocks
//         if (index === Level.GridEmpty) return
//         const block = this.blocks[index]
//         const x     = block.x
//         const y     = block.y
//         if (index !== this.blocks.length - 1) {
//             const lastBlock = this.blocks[this.blocks.length - 1]
//             this.blocks[index] = lastBlock
//             this.setIndices(this.indexGrid, lastBlock.x, lastBlock.y, Block.Width, Block.Height, index)
//         }
//         this.blocks.length--
//         this.setIndices(this.indexGrid, block.x, block.y, Block.Width, Block.Height, Level.GridEmpty)
//         // Remove direct soft connections
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             if ((block.softConnections & Connection.DirectionBits[i]) === 0) continue
//             const softConnectionVector  = Connection.DirectionVectors[i]
//             const softConnectionX       = x + Block.Width * softConnectionVector.dx
//             const softConnectionY       = y + Block.Height * softConnectionVector.dy
//             const softConnectionIndex   = this.getIndex(this.indexGrid, softConnectionX, softConnectionY)
//             const softConnectionBlock   = this.blocks[softConnectionIndex]
//             const oppositeDirection     = Connection.OppositeDirections[i]
//             const oppositeDirectionBit  = Connection.DirectionBits[oppositeDirection]
//             softConnectionBlock.softConnections &= ~oppositeDirectionBit
//         }
//         // Cache cardinal directions
//         const softCardinalConnection = new Array(Connection.CardinalDirectionCount).fill(false)
//         for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
//             const directionBit = Connection.DirectionBits[i]
//             softCardinalConnection[i] = (block.softConnections & directionBit) === directionBit
//         }
//         // Remove adjacent diagonal soft connections
//         for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
//             const directionA        = i
//             if (!softCardinalConnection[directionA]) continue
//             const directionB        = (i + 1) % Connection.CardinalDirectionCount
//             if (!softCardinalConnection[directionB]) continue
//             const vectorA           = Connection.DirectionVectors[directionA]
//             const vectorB           = Connection.DirectionVectors[directionB]
//             const xA                = x + vectorA.dx * Block.Width
//             const xB                = x + vectorB.dx * Block.Width
//             const yA                = y + vectorA.dy * Block.Height
//             const yB                = y + vectorB.dy * Block.Height
//             const indexA            = this.getIndex(this.indexGrid, xA, yA)
//             const indexB            = this.getIndex(this.indexGrid, xB, yB)
//             const blockA            = this.blocks[indexA]
//             const blockB            = this.blocks[indexB]
//             const diagonalA         = (directionA + 1) % 4 + 4
//             const diagonalB         = (directionB + 2) % 4 + 4
//             // (0, 1) -> (5, 7) or [1, 3]
//             // (1, 2) -> (6, 4) or [2, 0]
//             // (2, 3) -> (7, 5) or [3, 1]
//             // (3, 0) -> (4, 6) or [0, 2]
//             blockA.softConnections  &= ~Connection.DirectionBits[diagonalA]
//             blockB.softConnections  &= ~Connection.DirectionBits[diagonalB]
//         }
//         // Propagate removal to all hard connections
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             const directionBit          = Connection.DirectionBits[i]
//             const hardConnection        = (block.hardConnections & directionBit) === directionBit
//             if (!hardConnection) continue
//             const hardConnectionVector  = Connection.DirectionVectors[i]
//             const hardConnectionX       = x + Block.Width * hardConnectionVector.dx
//             const hardConnectionY       = y + Block.Height * hardConnectionVector.dy
//             const hardConnectionIndex   = this.getIndex(this.indexGrid, hardConnectionX, hardConnectionY)
//             this.remove(hardConnectionIndex)
//         }
//         const debrisCount = Math.floor(Debris.CountMinimum + Math.random() * (Debris.CountMaximum - Debris.CountMinimum))
//         for (let i = 0; i < debrisCount; i++) {
//             this.debris.push(new Debris(block))
//         }
//     }
//     fall() {
//         this.fallGrid.fill(Level.GridEmpty)
//         for (let i = 0; i < this.blocks.length; i++) {
//             const block = this.blocks[i]
//             if (block.grounded) continue
//             this.setIndices(this.indexGrid, block.x, block.y, Block.Width, Block.Height, Level.GridEmpty)
//             block.y++
//             this.setIndices(this.fallGrid, block.x, block.y, Block.Width, Block.Height, i)
//         }
//         for (let i = 0; i < this.fallGrid.length; i++) {
//             const index = this.fallGrid[i] 
//             if (index === Level.GridEmpty) continue
//             this.indexGrid[i] = index
//         }
//         for (const walker of this.walkers) {
//             if (!walker.grounded) {
//                 walker.y++
//             }
//         }
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) {
//                 creeper.y++
//             }
//         }
//     }
//     walkersGrounded() {
//         for (const walker of this.walkers) {
//             if (!walker.grounded) return false
//         }
//         return true
//     }
//     creepersGrounded() {
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) return false
//         }
//         return true
//     }
//     groundWalkers() {
//         for (const walker of this.walkers) {
//             const y         = walker.y + Walker.Height
//             const xEast     = walker.x + Walker.Width - 1
//             const indexEast = this.getIndex(this.indexGrid, xEast, y)
//             if (indexEast !== Level.GridEmpty && this.blocks[indexEast].grounded) {
//                 walker.grounded = true
//                 continue
//             }
//             const xWest     = walker.x
//             const indexWest = this.getIndex(this.indexGrid, xWest, y)
//             if (indexWest !== Level.GridEmpty && this.blocks[indexWest].grounded) {
//                 walker.grounded = true
//                 continue
//             }
//             walker.grounded = false
//         }
//     }
//     groundCreepers() {
//         for (const creeper of this.creepers) {
//             const y         = creeper.y + Creeper.Height
//             const xEast     = creeper.x + Creeper.Width - 1
//             const indexEast = this.getIndex(this.indexGrid, xEast, y)
//             if (indexEast !== Level.GridEmpty && this.blocks[indexEast].grounded) {
//                 creeper.grounded = true
//                 continue
//             }
//             const xWest     = creeper.x
//             const indexWest = this.getIndex(this.indexGrid, xWest, y)
//             if (indexWest !== Level.GridEmpty && this.blocks[indexWest].grounded) {
//                 creeper.grounded = true
//                 continue
//             }
//             creeper.grounded = false
//         }
//     }
//     measureWalkerFalls() {
//         for (const walker of this.walkers) {
//             if (walker.falling) {
//                 if (walker.grounded) {
//                     walker.falling = false
//                     walker.fallStop = walker.y
//                 }
//             } else {
//                 if (!walker.grounded) {
//                     walker.falling = true
//                     walker.fallStart = walker.y
//                 }
//             }
//         }
//     }
//     blocksGrounded() {
//         for (const block of this.blocks) {
//             if (!block.grounded) return false
//         }
//         return true
//     }
//     groundBlocks() {
//         for (const block of this.blocks) {
//             block.grounded = false
//         }
//         for (const block of this.blocks) {
//             if (Block.TypeFalls[block.type]) continue
//             this.groundBlock(block)
//         }
//     }
//     groundBlock(block: Block) {
//         if (block.grounded) return
//         block.grounded = true
//         // Ground block above
//         if (block.y > 0) {
//             const index = this.getIndex(this.indexGrid, block.x, block.y - 1)
//             if (index !== Level.GridEmpty) {
//                 this.groundBlock(this.blocks[index])
//             }
//         }
//         // Ground connected blocks
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             const directionBit      = Connection.DirectionBits[i]
//             const hardConnection    = (block.hardConnections & directionBit) === directionBit
//             const softConnection    = (block.softConnections & directionBit) === directionBit
//             if (!hardConnection && !softConnection) continue
//             const connectionVector  = Connection.DirectionVectors[i]
//             const connectionX       = block.x + connectionVector.dx * Block.Width
//             const connectionY       = block.y + connectionVector.dy * Block.Height
//             const connectionIndex   = this.getIndex(this.indexGrid, connectionX, connectionY)
//             const connectionBlock   = this.blocks[connectionIndex]
//             this.groundBlock(connectionBlock)
//         }
//     }
// }
// import Block        from './block.js'
// import Camera       from './camera.js'
// import Color        from './color.js'
// import Connection   from './connection.js'
// import Creeper      from './creeper.js'
// import Debris       from './debris.js'
// import LevelData    from './level_data.js'
// import Point from './point.js'
// import Sounds       from './sounds.js'
// import Splatter     from './splatter.js'
// import Walk from './walk.js'
// import Walker       from './walker.js'
// export default class Level {
//     static readonly GridEmpty       = 0xffff
//     static readonly GridWidth       = 640
//     static readonly GridHeight      = 360
//     static readonly GridCenterX     = Level.GridWidth / 2
//     static readonly GridCenterY     = Level.GridHeight / 2
//     static readonly BrickWidth      = 40
//     static readonly BrickHeight     = 30
//     static readonly CellCountX      = Level.GridWidth  / Block.Width
//     static readonly CellCountY      = Level.GridHeight / Block.Height
//     public levelData:       LevelData
//     public camera:          Camera
//     public blocks:          Block[]     = []
//     public walkers:         Walker[]    = []
//     public creepers:        Creeper[]   = []
//     public splatters:       Splatter[]  = []
//     public debris:          Debris[]    = []
//     public indexGrid:       Uint16Array = new Uint16Array(Level.GridWidth * Level.GridWidth).fill(Level.GridEmpty)
//     public fallFrame:       number      = 1
//     public removalIndex:    number      = -1
//     public deaths:          number      = 0
//     public frameDeaths:     number      = 0
//     public teleport:        boolean     = false
//     constructor(levelData: LevelData, camera: Camera) {
//         this.levelData  = levelData
//         this.camera     = camera
//         this.load()
//     }
//     load() {
//         const typeGrid                      = this.levelData.typeGrid
//         const attributeGrid                 = this.levelData.attributeGrid
//         const rowCount                      = typeGrid.length
//         const colCount                      = typeGrid[0].length
//         const newTypeGrid: string[]         = Array.from({ length: this.levelData.typeGrid[0].length }, () => '')
//         const blockGrid: Block[][]          = Array.from({ length: Level.CellCountX }, () => new Array(Level.CellCountY).fill(null))
//         // Flip type grid
//         for (let i = 0; i < colCount; i++) {
//             for (let j = 0; j < rowCount; j++) {
//                 newTypeGrid[i] += typeGrid[j][i]
//             }
//         }
//         // Initial block types
//         for (let i = 0; i < Level.CellCountX; i++) {
//             const cellX = i * 2
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const cellY     = j * 2
//                 const char      = newTypeGrid[cellX][cellY]
//                 const type      = Block.CharToType[char]
//                 if (type === Block.None) continue
//                 const color = type === Block.Portal ? Color.CharToColor[char] : Color.None
//                 const x         = i * Block.Width
//                 const y         = j * Block.Height
//                 const block     = new Block(x, y, type)
//                 blockGrid[i][j] = block
//             }
//         }
//         // Set char attributes
//         // Make sure to check for width on portal
//         // Update portal to return Jump type in recursion
//         for (let i = 0; i < Level.CellCountY; i++) {
//             const row       = i * 2
//             const line      = attributeGrid[row]
//             const tokens    = line.split(' ')
//             for (let j = 0; j < Level.CellCountX; j++) {
//                 if (blockGrid[j][i] === null) continue
//                 const token = tokens[j]
//                 for (const char of token) {
//                     blockGrid[j][i].setAttribute(char)
//                 }
//             }
//         }
//         // Horizontal connections
//         for (let i = 0; i < Level.CellCountX - 1; i++) {
//             const cellX = i * 2 + 1
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const cellY = j * 2
//                 const type  = Connection.CharToConnection[newTypeGrid[cellX][cellY]]
//                 const self  = blockGrid[i][j]
//                 const east  = blockGrid[i + 1][j]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections |= Connection.DirectionBits[Connection.East]
//                         east.softConnections |= Connection.DirectionBits[Connection.West]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections |= Connection.DirectionBits[Connection.East]
//                         east.hardConnections |= Connection.DirectionBits[Connection.West]
//                     break
//                 }
//             }
//         }
//         // Vertical connections
//         for (let i = 0; i < Level.CellCountX; i++) {
//             const cellX = i * 2
//             for (let j = 0; j < Level.CellCountY - 1; j++) {
//                 const cellY = j * 2 + 1
//                 const type  = Connection.CharToConnection[newTypeGrid[cellX][cellY]]
//                 const self  = blockGrid[i][j]
//                 const south = blockGrid[i][j + 1]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections    |= Connection.DirectionBits[Connection.South]
//                         south.softConnections   |= Connection.DirectionBits[Connection.North]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections    |= Connection.DirectionBits[Connection.South]
//                         south.hardConnections   |= Connection.DirectionBits[Connection.North]
//                     break
//                 }
//             }
//         }
//         // Corner connections
//         for (let i = 0; i < Level.CellCountX - 1; i++) {
//             const cellX = i * 2 + 1
//             for (let j = 0; j < Level.CellCountY - 1; j++) {
//                 const cellY     = j * 2 + 1
//                 const type      = Connection.CharToConnection[newTypeGrid[cellX][cellY]]
//                 const self      = blockGrid[i][j]
//                 const east      = blockGrid[i + 1][j]
//                 const south     = blockGrid[i][j + 1]
//                 const southeast = blockGrid[i + 1][j + 1]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections        |= Connection.DirectionBits[Connection.Southeast]
//                         east.softConnections        |= Connection.DirectionBits[Connection.Southwest]
//                         south.softConnections       |= Connection.DirectionBits[Connection.Northeast]
//                         southeast.softConnections   |= Connection.DirectionBits[Connection.Northwest]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections        |= Connection.DirectionBits[Connection.Southeast]
//                         east.hardConnections        |= Connection.DirectionBits[Connection.Southwest]
//                         south.hardConnections       |= Connection.DirectionBits[Connection.Northeast]
//                         southeast.hardConnections   |= Connection.DirectionBits[Connection.Northwest]
//                     break
//                 }
//             }
//         }
//         // Add to array
//         for (let i = 0; i < Level.CellCountX; i++) {
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const block = blockGrid[i][j] 
//                 if (block === null) continue
//                 this.blocks.push(block)
//             }
//         }
//         // Add to grid
//         for (let i = 0; i < this.blocks.length; i++) {
//             const block = this.blocks[i]
//             this.setIndices(block.x, block.y, Block.Width, Block.Height, i)
//         }
//         // Add walkers
//         for (const walkerData of this.levelData.walkerData) {
//             this.walkers.push(new Walker(walkerData[0], walkerData[1], walkerData[2]))
//         }
//         // Add creepers
//         for (const creeperData of this.levelData.creeperData) {
//             this.creepers.push(new Walker(creeperData[0], creeperData[1], creeperData[2]))
//         }
//     }
//     setIndices(x: number, y: number, w: number, h: number, index: number) {
//         for (let i = x; i < x + w; i++) {
//             for (let j = y; j < y + h; j++) {
//                 this.indexGrid[j * Level.GridWidth + i] = index
//             }
//         }
//     }
//     getIndex(x: number, y: number) {
//         return this.indexGrid[y * Level.GridWidth + x]
//     }
//     tap(gridX: number, gridY: number) {
//         if (this.fallFrame > 0) return
//         if (gridX < 0 || gridY < 0 || gridX >= Level.GridWidth || gridY >= Level.GridHeight) return
//         const index = this.getIndex(gridX, gridY)
//         if (index === Level.GridEmpty) return
//         const block = this.blocks[index]
//         if (!Block.TypeIsDestructible[block.type]) return
//         this.remove(index)
//         this.fallFrame = 1
//         Sounds.playBoom()
//     }
//     groundedCount() {
//         let groundedCount = 0
//         for (const block of this.blocks) {
//             if (block.grounded) {
//                 groundedCount++
//             }
//         }
//         return groundedCount
//     }
//     update(frame: number) {
//         this.frameDeaths = 0
//         if (this.fallFrame > 0) {
//             this.groundBlocks()
//             const startGroundedCount    = this.groundedCount()
//             const shakeIntensity        = this.fallFrame * this.fallFrame * 0.001
//             for (let i = 0; i < this.fallFrame; i++) {
//                 this.groundWalkers()
//                 this.groundCreepers()
//                 this.measureWalkerFalls()
//                 this.killFallingWalkers()
//                 this.crushWalkers()
//                 this.crushCreepers()
//                 if (this.blocksGrounded() 
//                     && this.walkersGrounded()
//                     && this.creepersGrounded()) {
//                     this.fallFrame = 0
//                     break
//                 }
//                 this.fall()
//                 this.murder()
//                 this.killFallingWalkers()
//                 this.groundBlocks()
//             }
//             const endGroundedCount  = this.groundedCount()
//             const landedCount       = endGroundedCount - startGroundedCount
//             this.camera.shake(shakeIntensity * landedCount)
//             if (landedCount > 0) {
//                 Sounds.playThump()
//             }
//         }
//         if (this.fallFrame > 0) {
//             this.fallFrame++
//         }
//         if (frame % 2 === 0) {
//             this.teleport = false
//             this.walk()
//             this.creep()
//             if (this.teleport) {
//                 Sounds.playWhoosh()
//             }
//             this.murder()
//         }
//         for (let i = 0; i < this.frameDeaths; i++) {
//             Sounds.playSplat()
//         }
//         this.updateSplatters()
//         this.updateDebris()
//     }
//     complete() {
//         return this.walkers.length === 0 && this.deaths === 0
//     }
//     murder() {
//         for (const creeper of this.creepers) {
//             for (const walker of this.walkers) {
//                 if (this.contact(creeper, walker)) {
//                     this.splatterWalker(walker, 1)
//                     walker.murdered = true
//                 }
//             }
//         }
//         const alive = []
//         for (const walker of this.walkers) {
//             if (!walker.murdered) {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     contact(creeper: Creeper, walker: Walker) {
//         return !(creeper.x + Creeper.Width <= walker.x
//                 || walker.x + Walker.Width <= creeper.x 
//                 || creeper.y + Creeper.Height <= walker.y 
//                 || walker.y + Walker.Height <= creeper.y)
//     }
//     pairedPortalIndex(portalIndex: number) {
//         const portal = this.blocks[portalIndex]
//         for (let i = 0; i < this.blocks.length; i++) {
//             if (i === portalIndex) continue
//             const pairedPortal = this.blocks[i]
//             if (pairedPortal.type === Block.Portal && pairedPortal.color === portal.color) {
//                 return i
//             } 
//         }
//         return Level.GridEmpty
//     }
//     walkType(x: number, y: number, height: number, direction: number): Walk {
//         //  Turn if there is no floor
//         const floorY        = y + height
//         const floorIndex    = this.getIndex(x, floorY)
//         if (floorIndex === Level.GridEmpty)                 return Walk.Turn
//         //  Turn if the floor is ethereal
//         const floorBlock    = this.blocks[floorIndex]
//         if (floorBlock.ethereal)                            return Walk.Turn
//         //  Turn if the floor is not grounded
//         if (!floorBlock.grounded)                           return Walk.Turn
//         //  Go if the next block is empty
//         const index         = this.getIndex(x, y)
//         if (index === Level.GridEmpty)                      return Walk.Walk
//         //  Go if the next block is ethereal
//         const block         = this.blocks[index]
//         if (block.ethereal)                                 return Walk.Walk
//         //  Turn if the next block is not grounded
//         if (!block.grounded)                                return Walk.Turn
//         //  Handle goal if next block is a goal
//         if (block.type === Block.Goal)                      return Walk.Goal
//         //  Handle portal if next block is a portal
//         if (block.type === Block.Portal) {
//             const pairedIndex   = this.pairedPortalIndex(index)
//             if (pairedIndex === Level.GridEmpty)            return Walk.Turn
//             const pairedBlock   = this.blocks[pairedIndex]
//             const teleportX     = direction === 1 ? pairedBlock.x + Block.Width : pairedBlock.x - 1
//             const teleportY     = pairedBlock.y + Block.Height - height
//             const walkType      = this.walkType(teleportX, teleportY, height, direction)
//             if (walkType === Walk.Walk)                     return Walk.Jump
//                                                             return walkType
//         }
//         //  Turn for all other block types
//                                                             return Walk.Turn
//     }
//     portalOutlet(x: number, y: number, height: number, width: number, direction: number): Point {
//         const index         = this.getIndex(x, y)
//         if (index === Level.GridEmpty) return new Point(x, y)
//         const pairedIndex   = this.pairedPortalIndex(index)
//         const pairedBlock   = this.blocks[pairedIndex]
//         const teleportX     = direction === 1 ? pairedBlock.x + Block.Width : pairedBlock.x - width
//         const teleportY     = pairedBlock.y + Block.Height - height
//         return this.portalOutlet(teleportX, teleportY, height, width, direction)
//     }
//     walk() {
//         let initialWalkerCount = this.walkers.length
//         for (const walker of this.walkers) {
//             if (!walker.grounded) continue
//             const x = walker.direction === 1 ? walker.x + Walker.Width : walker.x - 1
//             const y = walker.y
//             switch (this.walkType(x, y, Walker.Height, walker.direction)) {
//                 case Walk.Walk: {
//                     walker.x += walker.direction
//                     continue
//                 }
//                 case Walk.Turn: {
//                     walker.direction *= -1
//                     continue
//                 }
//                 case Walk.Goal: {
//                     walker.saved = true
//                     continue
//                 }
//                 case Walk.Jump: {
//                     const portalOutlet  = this.portalOutlet(x, y, Walker.Height, Walker.Width, walker.direction)
//                     walker.x            = portalOutlet.x
//                     walker.y            = portalOutlet.y
//                     continue
//                 }
//             }
//         }
//         this.walkers = this.walkers.filter(walker => !walker.saved)
//         if (initialWalkerCount > this.walkers.length) {
//             Sounds.playVanish()
//         }
//     }
//     creep() {
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) continue
//             const x = creeper.direction === 1 ? creeper.x + Creeper.Width : creeper.x - 1
//             const y = creeper.y
//             switch (this.walkType(x, y, Creeper.Height, creeper.direction)) {
//                 case Walk.Walk: {
//                     creeper.x += creeper.direction
//                     continue
//                 }
//                 case Walk.Goal:
//                 case Walk.Turn: {
//                     creeper.direction *= -1
//                     continue
//                 }
//                 case Walk.Jump: {
//                     const portalOutlet  = this.portalOutlet(x, y, Creeper.Height, Creeper.Width, creeper.direction)
//                     creeper.x           = portalOutlet.x
//                     creeper.y           = portalOutlet.y
//                     continue
//                 }
//             }
//         }
//     }
//     walkerCrushed(walker: Walker) {
//         if (!walker.grounded) return false
//         const indexEast = this.getIndex(walker.x + Walker.Width - 1, walker.y)
//         if (indexEast !== Level.GridEmpty && !this.blocks[indexEast].ethereal) return true
//         const indexWest = this.getIndex(walker.x, walker.y)
//         if (indexWest !== Level.GridEmpty && !this.blocks[indexWest].ethereal) return true
//         return false
//     }
//     creeperCrushed(creeper: Creeper) {
//         if (!creeper.grounded) return false
//         const indexEast = this.getIndex(creeper.x + Creeper.Width - 1, creeper.y)
//         if (indexEast !== Level.GridEmpty && !this.blocks[indexEast].ethereal) return true
//         const indexWest = this.getIndex(creeper.x, creeper.y)
//         if (indexWest !== Level.GridEmpty && !this.blocks[indexWest].ethereal) return true
//         return false
//     }
//     walkerKilledByFall(walker: Walker) {
//         return walker.fallStop - walker.fallStart > 30
//     }
//     crushWalkers() {
//         const alive = []
//         for (const walker of this.walkers) {
//             if (this.walkerCrushed(walker)) {
//                 this.splatterWalker(walker, 3)
//             } else {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     crushCreepers() {
//         const alive = []
//         for (const creeper of this.creepers) {
//             if (this.creeperCrushed(creeper)) {
//                 this.splatterCreeper(creeper, 3)
//             } else {
//                 alive.push(creeper)
//             }
//         }
//         this.creepers = alive
//     }
//     killFallingWalkers() {
//         const alive = []
//         for (const walker of this.walkers) {
//             if (this.walkerKilledByFall(walker)) {
//                 this.splatterWalker(walker, 1)
//             } else {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     splatterWalker(walker: Walker, vyScalar: number) {
//         this.deaths++
//         this.frameDeaths++
//         const count = Splatter.CountMinimum + Math.floor(Splatter.CountMaximum - Splatter.CountMinimum)
//         const x     = walker.x + Walker.Width / 2
//         const y     = walker.y + Walker.Height
//         for (let i = 0; i < count; i++) {
//             this.splatters.push(new Splatter(x, y, vyScalar))
//         }
//     }
//     splatterCreeper(creeper: Creeper, vyScalar: number) {
//         this.frameDeaths++
//         const count = Splatter.CountMinimum + Math.floor(Splatter.CountMaximum - Splatter.CountMinimum)
//         const x     = creeper.x + Creeper.Width / 2
//         const y     = creeper.y + Creeper.Height
//         for (let i = 0; i < count; i++) {
//             this.splatters.push(new Splatter(x, y, vyScalar))
//         }
//     }
//     updateDebris() {
//         for (const debris of this.debris) {
//             debris.vy   += Debris.FallSpeed
//             debris.x    += debris.vx
//             debris.y    += debris.vy
//             debris.frame++
//         }
//         this.debris = this.debris.filter(debris => debris.y < Level.GridHeight)
//     }
//     updateSplatters() {
//         for (const splatter of this.splatters) {
//             splatter.vy += Splatter.FallSpeed
//             splatter.x  += splatter.vx
//             splatter.y  += splatter.vy
//             const x     = Math.floor(splatter.x)
//             const y     = Math.floor(splatter.y)
//             if (x < 0 || y < 0 || x >= Level.GridWidth || y > Level.GridHeight) continue
//             const index = this.getIndex(x, y)
//             if (index !== Level.GridEmpty && Math.random() > 0.5) {
//                 splatter.splattered = true
//                 const block         = this.blocks[index]
//                 const blockX        = x - block.x
//                 const blockY        = y - block.y
//                 splatter.x          = blockX
//                 splatter.y          = blockY
//                 block.splatters.push(splatter)
//             }
//         }
//         this.splatters = this.splatters.filter(splatter => splatter.y < Level.GridHeight && !splatter.splattered)
//     }
//     remove(index: number) {
//         // Prevents recursion into deleted blocks
//         if (index === Level.GridEmpty) return
//         const block = this.blocks[index]
//         const x     = block.x
//         const y     = block.y
//         if (index !== this.blocks.length - 1) {
//             const lastBlock = this.blocks[this.blocks.length - 1]
//             this.blocks[index] = lastBlock
//             this.setIndices(lastBlock.x, lastBlock.y, Block.Width, Block.Height, index)
//         }
//         this.blocks.length--
//         this.setIndices(block.x, block.y, Block.Width, Block.Height, Level.GridEmpty)
//         // Remove direct soft connections
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             if ((block.softConnections & Connection.DirectionBits[i]) === 0) continue
//             const softConnectionVector  = Connection.DirectionVectors[i]
//             const softConnectionX       = x + Block.Width * softConnectionVector.dx
//             const softConnectionY       = y + Block.Height * softConnectionVector.dy
//             const softConnectionIndex   = this.getIndex(softConnectionX, softConnectionY)
//             const softConnectionBlock   = this.blocks[softConnectionIndex]
//             const oppositeDirection     = Connection.OppositeDirections[i]
//             const oppositeDirectionBit  = Connection.DirectionBits[oppositeDirection]
//             softConnectionBlock.softConnections &= ~oppositeDirectionBit
//         }
//         // Cache cardinal directions
//         const softCardinalConnection = new Array(Connection.CardinalDirectionCount).fill(false)
//         for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
//             const directionBit = Connection.DirectionBits[i]
//             softCardinalConnection[i] = (block.softConnections & directionBit) === directionBit
//         }
//         // Remove adjacent diagonal soft connections
//         for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
//             const directionA        = i
//             if (!softCardinalConnection[directionA]) continue
//             const directionB        = (i + 1) % Connection.CardinalDirectionCount
//             if (!softCardinalConnection[directionB]) continue
//             const vectorA           = Connection.DirectionVectors[directionA]
//             const vectorB           = Connection.DirectionVectors[directionB]
//             const xA                = x + vectorA.dx * Block.Width
//             const xB                = x + vectorB.dx * Block.Width
//             const yA                = y + vectorA.dy * Block.Height
//             const yB                = y + vectorB.dy * Block.Height
//             const indexA            = this.getIndex(xA, yA)
//             const indexB            = this.getIndex(xB, yB)
//             const blockA            = this.blocks[indexA]
//             const blockB            = this.blocks[indexB]
//             const diagonalA         = (directionA + 1) % 4 + 4
//             const diagonalB         = (directionB + 2) % 4 + 4
//             // (0, 1) -> (5, 7) or [1, 3]
//             // (1, 2) -> (6, 4) or [2, 0]
//             // (2, 3) -> (7, 5) or [3, 1]
//             // (3, 0) -> (4, 6) or [0, 2]
//             blockA.softConnections  &= ~Connection.DirectionBits[diagonalA]
//             blockB.softConnections  &= ~Connection.DirectionBits[diagonalB]
//         }
//         // Propagate removal to all hard connections
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             const directionBit          = Connection.DirectionBits[i]
//             const hardConnection        = (block.hardConnections & directionBit) === directionBit
//             if (!hardConnection) continue
//             const hardConnectionVector  = Connection.DirectionVectors[i]
//             const hardConnectionX       = x + Block.Width * hardConnectionVector.dx
//             const hardConnectionY       = y + Block.Height * hardConnectionVector.dy
//             const hardConnectionIndex   = this.getIndex(hardConnectionX, hardConnectionY)
//             this.remove(hardConnectionIndex)
//         }
//         const debrisCount = Math.floor(Debris.CountMinimum + Math.random() * (Debris.CountMaximum - Debris.CountMinimum))
//         for (let i = 0; i < debrisCount; i++) {
//             this.debris.push(new Debris(block))
//         }
//     }
//     fall() {
//         const sortedBlocks = this.blocks.slice().sort((a, b) => b.y - a.y)
//         for (const block of sortedBlocks) {
//             if (block.grounded) continue
//             const index = this.getIndex(block.x, block.y)
//             this.setIndices(block.x, block.y, Block.Width, 1, Level.GridEmpty)
//             this.setIndices(block.x, block.y + Block.Height, Block.Width, 1, index)
//             block.y++
//         }
//         for (const walker of this.walkers) {
//             if (!walker.grounded) {
//                 walker.y++
//             }
//         }
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) {
//                 creeper.y++
//             }
//         }
//     }
//     walkersGrounded() {
//         for (const walker of this.walkers) {
//             if (!walker.grounded) return false
//         }
//         return true
//     }
//     creepersGrounded() {
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) return false
//         }
//         return true
//     }
//     groundWalkers() {
//         for (const walker of this.walkers) {
//             const y         = walker.y + Walker.Height
//             const xEast     = walker.x + Walker.Width - 1
//             const indexEast = this.getIndex(xEast, y)
//             if (indexEast !== Level.GridEmpty) {
//                 const block = this.blocks[indexEast]
//                 if (block.grounded && !block.ethereal) {
//                     walker.grounded = true
//                     continue
//                 }
//             }
//             const xWest     = walker.x
//             const indexWest = this.getIndex(xWest, y)
//             if (indexWest !== Level.GridEmpty) {
//                 const block = this.blocks[indexWest]
//                 if (block.grounded && !block.ethereal) {
//                     walker.grounded = true
//                     continue
//                 }
//             }
//             walker.grounded = false
//         }
//     }
//     groundCreepers() {
//         for (const creeper of this.creepers) {
//             const y         = creeper.y + Creeper.Height
//             const xEast     = creeper.x + Creeper.Width - 1
//             const indexEast = this.getIndex(xEast, y)
//             if (indexEast !== Level.GridEmpty) {
//                 const block = this.blocks[indexEast]
//                 if (block.grounded && !block.ethereal) {
//                     creeper.grounded = true
//                     continue
//                 }
//             }
//             const xWest     = creeper.x
//             const indexWest = this.getIndex(xWest, y)
//             if (indexWest !== Level.GridEmpty) {
//                 const block = this.blocks[indexWest]
//                 if (block.grounded && !block.ethereal) {
//                     creeper.grounded = true
//                     continue
//                 }
//             }
//             creeper.grounded = false
//         }
//     }
//     measureWalkerFalls() {
//         for (const walker of this.walkers) {
//             if (walker.falling) {
//                 if (walker.grounded) {
//                     walker.falling = false
//                     walker.fallStop = walker.y
//                 }
//             } else {
//                 if (!walker.grounded) {
//                     walker.falling = true
//                     walker.fallStart = walker.y
//                 }
//             }
//         }
//     }
//     blocksGrounded() {
//         for (const block of this.blocks) {
//             if (!block.grounded) return false
//         }
//         return true
//     }
//     groundBlocks() {
//         for (const block of this.blocks) {
//             block.grounded = false
//         }
//         for (const block of this.blocks) {
//             if (Block.TypeFalls[block.type]) continue
//             this.groundBlock(block)
//         }
//     }
//     groundBlock(block: Block) {
//         if (block.grounded) return
//         block.grounded = true
//         // Ground block above
//         if (block.y > 0) {
//             const index = this.getIndex(block.x, block.y - 1)
//             if (index !== Level.GridEmpty) {
//                 this.groundBlock(this.blocks[index])
//             }
//         }
//         // Ground connected blocks
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             const directionBit      = Connection.DirectionBits[i]
//             const hardConnection    = (block.hardConnections & directionBit) === directionBit
//             const softConnection    = (block.softConnections & directionBit) === directionBit
//             if (!hardConnection && !softConnection) continue
//             const connectionVector  = Connection.DirectionVectors[i]
//             const connectionX       = block.x + connectionVector.dx * Block.Width
//             const connectionY       = block.y + connectionVector.dy * Block.Height
//             const connectionIndex   = this.getIndex(connectionX, connectionY)
//             const connectionBlock   = this.blocks[connectionIndex]
//             this.groundBlock(connectionBlock)
//         }
//         // Ground magnet blocks
//         if (block.type === Block.Magnet) {
//             for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
//                 const magneticVector    = Connection.DirectionVectors[i]
//                 const magneticX         = block.x + magneticVector.dx * Block.Width
//                 const magneticY         = block.y + magneticVector.dy * Block.Height
//                 const magneticIndex     = this.getIndex(magneticX, magneticY)
//                 if (magneticIndex === Level.GridEmpty) continue
//                 const magneticBlock     = this.blocks[magneticIndex]
//                 if (magneticBlock.type !== Block.Magnet) continue
//                 if (magneticBlock.y !== magneticY) continue
//                 this.groundBlock(magneticBlock)
//             }
//         }
//     }
// }
// import Block        from './block.js'
// import Camera       from './camera.js'
// import Color        from './color.js'
// import Connection   from './connection.js'
// import Creeper      from './creeper.js'
// import Debris       from './debris.js'
// import LevelData    from './level_data.js'
// import Mover        from './mover.js'
// import Point        from './point.js'
// import Rect         from './rect.js'
// import Sounds       from './sounds.js'
// import Splatter     from './splatter.js'
// import Walk         from './walk.js'
// import Walker       from './walker.js'
// //  Maintain a step and steps variable
// //  Add a step and steps variable to each mover
// //  On each fall frame
// //      Find the next movers
// //      Move down movers first, then up movers, in the event of a tie
// //      For blocks, only perform checks against adjacent blocks in column
// //      For movers, only perform checks against blocks in columns spanned
// //      
// //      
// //  Create an array advancing all block positions
// //  
// export default class Level {
//     static readonly GridEmpty       = 0xffff
//     static readonly GridWidth       = 640
//     static readonly GridHeight      = 360
//     static readonly GridCenterX     = Level.GridWidth / 2
//     static readonly GridCenterY     = Level.GridHeight / 2
//     static readonly BrickWidth      = 40
//     static readonly BrickHeight     = 30
//     static readonly CellCountX      = Level.GridWidth  / Block.Width
//     static readonly CellCountY      = Level.GridHeight / Block.Height
//     public levelData:       LevelData
//     public camera:          Camera
//     public blocks:          Block[]     = []
//     public walkers:         Walker[]    = []
//     public creepers:        Creeper[]   = []
//     public splatters:       Splatter[]  = []
//     public debris:          Debris[]    = []
//     public indexGrid:       Uint16Array = new Uint16Array(Level.GridWidth * Level.GridWidth).fill(Level.GridEmpty)
//     public fallFrame:       number      = 1
//     public removalIndex:    number      = -1
//     public deaths:          number      = 0
//     public frameDeaths:     number      = 0
//     public teleport:        boolean     = false
//     constructor(levelData: LevelData, camera: Camera) {
//         this.levelData  = levelData
//         this.camera     = camera
//         this.load()
//     }
//     load() {
//         const typeGrid                      = this.levelData.typeGrid
//         const attributeGrid                 = this.levelData.attributeGrid
//         const rowCount                      = typeGrid.length
//         const colCount                      = typeGrid[0].length
//         const newTypeGrid: string[]         = Array.from({ length: this.levelData.typeGrid[0].length }, () => '')
//         const blockGrid: Block[][]          = Array.from({ length: Level.CellCountX }, () => new Array(Level.CellCountY).fill(null))
//         // Flip type grid
//         for (let i = 0; i < colCount; i++) {
//             for (let j = 0; j < rowCount; j++) {
//                 newTypeGrid[i] += typeGrid[j][i]
//             }
//         }
//         // Initial block types
//         for (let i = 0; i < Level.CellCountX; i++) {
//             const cellX = i * 2
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const cellY     = j * 2
//                 const char      = newTypeGrid[cellX][cellY]
//                 const type      = Block.CharToType[char]
//                 if (type === Block.None) continue
//                 const color = type === Block.Portal ? Color.CharToColor[char] : Color.None
//                 const x         = i * Block.Width
//                 const y         = j * Block.Height
//                 const block     = new Block(x, y, type)
//                 blockGrid[i][j] = block
//             }
//         }
//         // Set char attributes
//         // Make sure to check for width on portal
//         // Update portal to return Jump type in recursion
//         for (let i = 0; i < Level.CellCountY; i++) {
//             const row       = i * 2
//             const line      = attributeGrid[row]
//             const tokens    = line.split(' ')
//             for (let j = 0; j < Level.CellCountX; j++) {
//                 if (blockGrid[j][i] === null) continue
//                 const token = tokens[j]
//                 for (const char of token) {
//                     blockGrid[j][i].setAttribute(char)
//                 }
//             }
//         }
//         // Horizontal connections
//         for (let i = 0; i < Level.CellCountX - 1; i++) {
//             const cellX = i * 2 + 1
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const cellY = j * 2
//                 const type  = Connection.CharToConnection[newTypeGrid[cellX][cellY]]
//                 const self  = blockGrid[i][j]
//                 const east  = blockGrid[i + 1][j]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections |= Connection.DirectionBits[Connection.East]
//                         east.softConnections |= Connection.DirectionBits[Connection.West]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections |= Connection.DirectionBits[Connection.East]
//                         east.hardConnections |= Connection.DirectionBits[Connection.West]
//                     break
//                 }
//             }
//         }
//         // Vertical connections
//         for (let i = 0; i < Level.CellCountX; i++) {
//             const cellX = i * 2
//             for (let j = 0; j < Level.CellCountY - 1; j++) {
//                 const cellY = j * 2 + 1
//                 const type  = Connection.CharToConnection[newTypeGrid[cellX][cellY]]
//                 const self  = blockGrid[i][j]
//                 const south = blockGrid[i][j + 1]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections    |= Connection.DirectionBits[Connection.South]
//                         south.softConnections   |= Connection.DirectionBits[Connection.North]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections    |= Connection.DirectionBits[Connection.South]
//                         south.hardConnections   |= Connection.DirectionBits[Connection.North]
//                     break
//                 }
//             }
//         }
//         // Corner connections
//         for (let i = 0; i < Level.CellCountX - 1; i++) {
//             const cellX = i * 2 + 1
//             for (let j = 0; j < Level.CellCountY - 1; j++) {
//                 const cellY     = j * 2 + 1
//                 const type      = Connection.CharToConnection[newTypeGrid[cellX][cellY]]
//                 const self      = blockGrid[i][j]
//                 const east      = blockGrid[i + 1][j]
//                 const south     = blockGrid[i][j + 1]
//                 const southeast = blockGrid[i + 1][j + 1]
//                 switch (type) {
//                     case Connection.Soft:
//                         self.softConnections        |= Connection.DirectionBits[Connection.Southeast]
//                         east.softConnections        |= Connection.DirectionBits[Connection.Southwest]
//                         south.softConnections       |= Connection.DirectionBits[Connection.Northeast]
//                         southeast.softConnections   |= Connection.DirectionBits[Connection.Northwest]
//                     break
//                     case Connection.Hard:
//                         self.hardConnections        |= Connection.DirectionBits[Connection.Southeast]
//                         east.hardConnections        |= Connection.DirectionBits[Connection.Southwest]
//                         south.hardConnections       |= Connection.DirectionBits[Connection.Northeast]
//                         southeast.hardConnections   |= Connection.DirectionBits[Connection.Northwest]
//                     break
//                 }
//             }
//         }
//         // Add to array
//         for (let i = 0; i < Level.CellCountX; i++) {
//             for (let j = 0; j < Level.CellCountY; j++) {
//                 const block = blockGrid[i][j] 
//                 if (block === null) continue
//                 this.blocks.push(block)
//             }
//         }
//         // Add to grid
//         for (let i = 0; i < this.blocks.length; i++) {
//             const block = this.blocks[i]
//             this.setIndices(block.x, block.y, Block.Width, Block.Height, i)
//         }
//         // Add walkers
//         for (const walkerData of this.levelData.walkerData) {
//             this.walkers.push(new Walker(walkerData[0], walkerData[1], walkerData[2]))
//         }
//         // Add creepers
//         for (const creeperData of this.levelData.creeperData) {
//             this.creepers.push(new Walker(creeperData[0], creeperData[1], creeperData[2]))
//         }
//     }
//     setIndices(x: number, y: number, w: number, h: number, index: number) {
//         for (let i = x; i < x + w; i++) {
//             for (let j = y; j < y + h; j++) {
//                 this.indexGrid[j * Level.GridWidth + i] = index
//             }
//         }
//     }
//     getIndex(x: number, y: number) {
//         return this.indexGrid[y * Level.GridWidth + x]
//     }
//     tap(gridX: number, gridY: number) {
//         if (this.fallFrame > 0) return
//         if (gridX < 0 || gridY < 0 || gridX >= Level.GridWidth || gridY >= Level.GridHeight) return
//         const index = this.getIndex(gridX, gridY)
//         if (index === Level.GridEmpty) return
//         const block = this.blocks[index]
//         if (!Block.TypeIsDestructible[block.type]) return
//         this.remove(index)
//         this.fallFrame = 1
//         Sounds.playBoom()
//     }
//     groundedCount() {
//         let groundedCount = 0
//         for (const block of this.blocks) {
//             if (block.grounded) {
//                 groundedCount++
//             }
//         }
//         return groundedCount
//     }
//     update(frame: number) {
//         this.frameDeaths = 0
//         if (this.fallFrame > 0) {
//             this.groundBlocks()
//             const startGroundedCount    = this.groundedCount()
//             const shakeIntensity        = this.fallFrame * this.fallFrame * 0.001
//             for (let i = 0; i < this.fallFrame; i++) {
//                 this.groundWalkers()
//                 this.groundCreepers()
//                 this.measureWalkerFalls()
//                 this.killFallingWalkers()
//                 this.crushWalkers()
//                 this.crushCreepers()
//                 const beams = this.beams()
//                 this.shootWalkers(beams)
//                 this.shootCreepers(beams)
//                 if (this.blocksGrounded() 
//                     && this.walkersGrounded()
//                     && this.creepersGrounded()) {
//                     this.fallFrame = 0
//                     break
//                 }
//                 this.fall()
//                 this.murder()
//                 this.killFallingWalkers()
//                 this.groundBlocks()
//             }
//             const endGroundedCount  = this.groundedCount()
//             const landedCount       = endGroundedCount - startGroundedCount
//             this.camera.shake(shakeIntensity * landedCount)
//             if (landedCount > 0) {
//                 Sounds.playThump()
//             }
//         }
//         if (this.fallFrame > 0) {
//             this.fallFrame++
//         }
//         if (frame % 2 === 0) {
//             this.teleport = false
//             this.walk()
//             this.creep()
//             if (this.teleport) {
//                 Sounds.playWhoosh()
//             }
//             this.murder()
//             const beams = this.beams()
//             this.shootWalkers(beams)
//             this.shootCreepers(beams)
//         }
//         for (let i = 0; i < this.frameDeaths; i++) {
//             Sounds.playSplat()
//         }
//         this.updateSplatters()
//         this.updateDebris()
//     }
//     complete() {
//         return this.walkers.length === 0 && this.deaths === 0
//     }
//     // Return Number.MAX_SAFE_INTEGER for no collision
//     beamRect(beamX: number, beamY: number, direction: number, x: number, y: number, w: number, h: number) {
//         switch (direction) {
//             case Connection.East: {
//                 if (x + w < beamX)  return null
//                 if (y > beamY)      return null
//                 if (y + h < beamY)  return null
//                 return new Rect(beamX, beamY, x - beamX, 0)
//             }
//             case Connection.South: {
//                 if (y + h < beamY)  return null
//                 if (x > beamX)      return null
//                 if (x + w < beamX)  return null
//                 return new Rect(beamX, beamY, 0, y - beamY)
//             }
//             case Connection.West: {
//                 if (x > beamX)      return null
//                 if (y > beamY)      return null
//                 if (y + h < beamY)  return null
//                 return new Rect(x + w, beamY, beamX - x, 0)
//             }
//             case Connection.North: {
//                 if (y > beamY)      return null
//                 if (x > beamX)      return null
//                 if (x + w < beamX)  return null
//                 return new Rect(beamX, y + h, 0, beamY - y)
//             }
//         }
//         return null
//     }
//     beamIntersects(
//         x1: number, y1: number, w1: number, h1: number, 
//         x2: number, y2: number, w2: number, h2: number
//     ) {
//         return !(   x1 > x2 + w2
//             ||      y1 > y2 + h2
//             ||      x2 > x1 + w1 
//             ||      y2 > y1 + h1)
//     }
//     beams() {
//         const beams: Rect[] = []
//         for (const block of this.blocks) {
//             if (block.type !== Block.Beam) continue
//             const x1                = block.x + Block.Width / 2
//             const y1                = block.y + Block.Height / 2
//             let collisionDistance   = Number.MAX_SAFE_INTEGER
//             let beamRect            = null
//             for (const other of this.blocks) {
//                 if (other.ethereal)     continue
//                 if (block === other)    continue
//                 const rect = this.beamRect(x1, y1, block.direction, other.x, other.y, Block.Width, Block.Height)
//                 if (rect === null)  continue
//                 const distance = rect.w + rect.h
//                 if (distance < collisionDistance) {
//                     collisionDistance   = distance
//                     beamRect            = rect
//                 }
//             }
//             if (beamRect !== null) {
//                 beams.push(beamRect)
//             }
//         }
//         return beams
//     }
//     shootWalkers(beams: Rect[]) {
//         for (const beam of beams) {
//             for (const walker of this.walkers) {
//                 if (this.beamIntersects(beam.x, beam.y, beam.w, beam.h, 
//                                         walker.x, walker.y, Walker.Width, Walker.Height)) {
//                     this.splatterWalker(walker, 1)
//                     walker.killed = true
//                 }
//             }
//         }
//         const alive = []
//         for (const walker of this.walkers) {
//             if (!walker.killed) {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     shootCreepers(beams: Rect[]) {
//         for (const beam of beams) {
//             for (const creeper of this.creepers) {
//                 if (this.beamIntersects(beam.x, beam.y, beam.w, beam.h, 
//                                         creeper.x, creeper.y, Creeper.Width, Creeper.Height)) {
//                     this.splatterCreeper(creeper, 1)
//                     creeper.killed = true
//                 }
//             }
//         }
//         const alive = []
//         for (const creeper of this.creepers) {
//             if (!creeper.killed) {
//                 alive.push(creeper)
//             }
//         }
//         this.creepers = alive
//     }
//     murder() {
//         for (const creeper of this.creepers) {
//             for (const walker of this.walkers) {
//                 if (this.contact(creeper, walker)) {
//                     this.splatterWalker(walker, 1)
//                     walker.killed = true
//                 }
//             }
//         }
//         const alive = []
//         for (const walker of this.walkers) {
//             if (!walker.killed) {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     contact(creeper: Creeper, walker: Walker) {
//         return !(creeper.x + Creeper.Width <= walker.x
//                 || walker.x + Walker.Width <= creeper.x 
//                 || creeper.y + Creeper.Height <= walker.y 
//                 || walker.y + Walker.Height <= creeper.y)
//     }
//     pairedPortalIndex(portalIndex: number) {
//         const portal = this.blocks[portalIndex]
//         for (let i = 0; i < this.blocks.length; i++) {
//             if (i === portalIndex) continue
//             const pairedPortal = this.blocks[i]
//             if (pairedPortal.type === Block.Portal && pairedPortal.color === portal.color) {
//                 return i
//             } 
//         }
//         return Level.GridEmpty
//     }
//     walkType(mover: Mover, width: number, height: number): Walk {
//         const x = mover.direction === 1 ? mover.x + width : mover.x - 1
//         const y = mover.y
//         //  Turn if there is no floor
//         const floorY        = y + height
//         const floorIndex    = this.getIndex(x, floorY)
//         if (floorIndex === Level.GridEmpty)                 return Walk.Turn
//         //  Turn if the floor is ethereal
//         const floorBlock    = this.blocks[floorIndex]
//         if (floorBlock.ethereal)                            return Walk.Turn
//         //  Turn if the floor is not grounded
//         if (!floorBlock.grounded)                           return Walk.Turn
//         //  Go if the next block is empty
//         const index         = this.getIndex(x, y)
//         if (index === Level.GridEmpty)                      return Walk.Walk
//         //  Go if the next block is ethereal
//         const block         = this.blocks[index]
//         if (block.ethereal)                                 return Walk.Walk
//         //  Turn if the next block is not grounded
//         if (!block.grounded)                                return Walk.Turn
//         //  Handle goal if next block is a goal
//         if (block.type === Block.Goal)                      return Walk.Goal
//         //  Handle portal if next block is a portal
//         if (block.type === Block.Portal) {
//             const pairedIndex   = this.pairedPortalIndex(index)
//             if (pairedIndex === Level.GridEmpty)            return Walk.Walk
//             const pairedBlock   = this.blocks[pairedIndex]
//             const floorIndex    = this.getIndex(pairedBlock.x, pairedBlock.y + Block.Height)
//             if (floorIndex === Level.GridEmpty)             return Walk.Walk
//             if (!this.blocks[floorIndex].grounded)          return Walk.Walk
//             const middleX       = mover.x * 2 + width
//             const middleBlockX  = block.x * 2 + Block.Width
//             const sign          = Math.sign(middleX - middleBlockX)
//             const nextMiddleX   = middleX + mover.direction * 2
//             const nextSign      = Math.sign(nextMiddleX - middleBlockX)
//             if (sign !== nextSign)                          return Walk.Jump
//                                                             return Walk.Walk
//         }
//         //  Turn for all other block types
//                                                             return Walk.Turn
//     }
//     // Assumes the mover's presence in a working portal
//     portalOutlet(mover: Mover): Point {
//         const index         = this.getIndex(mover.x, mover.y)
//         const block         = this.blocks[index]
//         const pairedIndex   = this.pairedPortalIndex(index)
//         const pairedBlock   = this.blocks[pairedIndex]
//         const teleportX     = pairedBlock.x + (mover.x - block.x) + mover.direction * 2
//         const teleportY     = pairedBlock.y + (mover.y - block.y)
//         return new Point(teleportX, teleportY)
//     }
//     walk() {
//         let initialWalkerCount = this.walkers.length
//         for (const walker of this.walkers) {
//             if (!walker.grounded) continue
//             switch (this.walkType(walker, Walker.Width, Walker.Height)) {
//                 case Walk.Walk: {
//                     walker.x += walker.direction
//                     continue
//                 }
//                 case Walk.Turn: {
//                     walker.direction *= -1
//                     continue
//                 }
//                 case Walk.Goal: {
//                     walker.saved = true
//                     continue
//                 }
//                 case Walk.Jump: {
//                     const portalOutlet  = this.portalOutlet(walker)
//                     walker.x            = portalOutlet.x
//                     walker.y            = portalOutlet.y
//                     this.teleport       = true
//                     continue
//                 }
//             }
//         }
//         this.walkers = this.walkers.filter(walker => !walker.saved)
//         if (initialWalkerCount > this.walkers.length) {
//             Sounds.playVanish()
//         }
//     }
//     creep() {
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) continue
//             switch (this.walkType(creeper, Creeper.Width, Creeper.Height)) {
//                 case Walk.Walk: {
//                     creeper.x += creeper.direction
//                     continue
//                 }
//                 case Walk.Goal:
//                 case Walk.Turn: {
//                     creeper.direction *= -1
//                     continue
//                 }
//                 case Walk.Jump: {
//                     const portalOutlet  = this.portalOutlet(creeper)
//                     creeper.x           = portalOutlet.x
//                     creeper.y           = portalOutlet.y
//                     this.teleport       = true
//                     continue
//                 }
//             }
//         }
//     }
//     walkerCrushed(walker: Walker) {
//         if (!walker.grounded) return false
//         const indexEast = this.getIndex(walker.x + Walker.Width - 1, walker.y)
//         if (indexEast !== Level.GridEmpty) {
//             const blockEast = this.blocks[indexEast]
//             if (!blockEast.ethereal && blockEast.type !== Block.Portal) return true
//         }
//         const indexWest = this.getIndex(walker.x, walker.y)
//         if (indexWest !== Level.GridEmpty) {
//             const blockWest = this.blocks[indexWest]
//             if (!blockWest.ethereal && blockWest.type !== Block.Portal) return true
//         }
//         return false
//     }
//     creeperCrushed(creeper: Creeper) {
//         if (!creeper.grounded) return false
//         const indexEast = this.getIndex(creeper.x + Creeper.Width - 1, creeper.y)
//         if (indexEast !== Level.GridEmpty) {
//             const blockEast = this.blocks[indexEast]
//             if (!blockEast.ethereal && blockEast.type !== Block.Portal) return true
//         }
//         const indexWest = this.getIndex(creeper.x, creeper.y)
//         if (indexWest !== Level.GridEmpty) {
//             const blockWest = this.blocks[indexWest]
//             if (!blockWest.ethereal && blockWest.type !== Block.Portal) return true
//         }
//         return false
//     }
//     walkerKilledByFall(walker: Walker) {
//         return walker.fallStop - walker.fallStart > 30
//     }
//     crushWalkers() {
//         const alive = []
//         for (const walker of this.walkers) {
//             if (this.walkerCrushed(walker)) {
//                 this.splatterWalker(walker, 3)
//             } else {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     crushCreepers() {
//         const alive = []
//         for (const creeper of this.creepers) {
//             if (this.creeperCrushed(creeper)) {
//                 this.splatterCreeper(creeper, 3)
//             } else {
//                 alive.push(creeper)
//             }
//         }
//         this.creepers = alive
//     }
//     killFallingWalkers() {
//         const alive = []
//         for (const walker of this.walkers) {
//             if (this.walkerKilledByFall(walker)) {
//                 this.splatterWalker(walker, 1)
//             } else {
//                 alive.push(walker)
//             }
//         }
//         this.walkers = alive
//     }
//     splatterWalker(walker: Walker, vyScalar: number) {
//         this.deaths++
//         this.frameDeaths++
//         const count = Splatter.CountMinimum + Math.floor(Splatter.CountMaximum - Splatter.CountMinimum)
//         const x     = walker.x + Walker.Width / 2
//         const y     = walker.y + Walker.Height
//         for (let i = 0; i < count; i++) {
//             this.splatters.push(new Splatter(x, y, vyScalar))
//         }
//     }
//     splatterCreeper(creeper: Creeper, vyScalar: number) {
//         this.frameDeaths++
//         const count = Splatter.CountMinimum + Math.floor(Splatter.CountMaximum - Splatter.CountMinimum)
//         const x     = creeper.x + Creeper.Width / 2
//         const y     = creeper.y + Creeper.Height
//         for (let i = 0; i < count; i++) {
//             this.splatters.push(new Splatter(x, y, vyScalar))
//         }
//     }
//     updateDebris() {
//         for (const debris of this.debris) {
//             debris.vy   += Debris.FallSpeed
//             debris.x    += debris.vx
//             debris.y    += debris.vy
//             debris.frame++
//         }
//         this.debris = this.debris.filter(debris => debris.y < Level.GridHeight)
//     }
//     updateSplatters() {
//         for (const splatter of this.splatters) {
//             splatter.vy += Splatter.FallSpeed
//             splatter.x  += splatter.vx
//             splatter.y  += splatter.vy
//             const x     = Math.floor(splatter.x)
//             const y     = Math.floor(splatter.y)
//             if (x < 0 || y < 0 || x >= Level.GridWidth || y > Level.GridHeight) continue
//             const index = this.getIndex(x, y)
//             if (index !== Level.GridEmpty && Math.random() > 0.5) {
//                 splatter.splattered = true
//                 const block         = this.blocks[index]
//                 const blockX        = x - block.x
//                 const blockY        = y - block.y
//                 splatter.x          = blockX
//                 splatter.y          = blockY
//                 block.splatters.push(splatter)
//             }
//         }
//         this.splatters = this.splatters.filter(splatter => splatter.y < Level.GridHeight && !splatter.splattered)
//     }
//     remove(index: number) {
//         // Prevents recursion into deleted blocks
//         if (index === Level.GridEmpty) return
//         const block = this.blocks[index]
//         const x     = block.x
//         const y     = block.y
//         if (index !== this.blocks.length - 1) {
//             const lastBlock = this.blocks[this.blocks.length - 1]
//             this.blocks[index] = lastBlock
//             this.setIndices(lastBlock.x, lastBlock.y, Block.Width, Block.Height, index)
//         }
//         this.blocks.length--
//         this.setIndices(block.x, block.y, Block.Width, Block.Height, Level.GridEmpty)
//         // Remove direct soft connections
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             if ((block.softConnections & Connection.DirectionBits[i]) === 0) continue
//             const softConnectionVector  = Connection.DirectionVectors[i]
//             const softConnectionX       = x + Block.Width * softConnectionVector.dx
//             const softConnectionY       = y + Block.Height * softConnectionVector.dy
//             const softConnectionIndex   = this.getIndex(softConnectionX, softConnectionY)
//             const softConnectionBlock   = this.blocks[softConnectionIndex]
//             const oppositeDirection     = Connection.OppositeDirections[i]
//             const oppositeDirectionBit  = Connection.DirectionBits[oppositeDirection]
//             softConnectionBlock.softConnections &= ~oppositeDirectionBit
//         }
//         // Cache cardinal directions
//         const softCardinalConnection = new Array(Connection.CardinalDirectionCount).fill(false)
//         for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
//             const directionBit = Connection.DirectionBits[i]
//             softCardinalConnection[i] = (block.softConnections & directionBit) === directionBit
//         }
//         // Remove adjacent diagonal soft connections
//         for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
//             const directionA        = i
//             if (!softCardinalConnection[directionA]) continue
//             const directionB        = (i + 1) % Connection.CardinalDirectionCount
//             if (!softCardinalConnection[directionB]) continue
//             const vectorA           = Connection.DirectionVectors[directionA]
//             const vectorB           = Connection.DirectionVectors[directionB]
//             const xA                = x + vectorA.dx * Block.Width
//             const xB                = x + vectorB.dx * Block.Width
//             const yA                = y + vectorA.dy * Block.Height
//             const yB                = y + vectorB.dy * Block.Height
//             const indexA            = this.getIndex(xA, yA)
//             const indexB            = this.getIndex(xB, yB)
//             const blockA            = this.blocks[indexA]
//             const blockB            = this.blocks[indexB]
//             const diagonalA         = (directionA + 1) % 4 + 4
//             const diagonalB         = (directionB + 2) % 4 + 4
//             // (0, 1) -> (5, 7) or [1, 3]
//             // (1, 2) -> (6, 4) or [2, 0]
//             // (2, 3) -> (7, 5) or [3, 1]
//             // (3, 0) -> (4, 6) or [0, 2]
//             blockA.softConnections  &= ~Connection.DirectionBits[diagonalA]
//             blockB.softConnections  &= ~Connection.DirectionBits[diagonalB]
//         }
//         // Propagate removal to all hard connections
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             const directionBit          = Connection.DirectionBits[i]
//             const hardConnection        = (block.hardConnections & directionBit) === directionBit
//             if (!hardConnection) continue
//             const hardConnectionVector  = Connection.DirectionVectors[i]
//             const hardConnectionX       = x + Block.Width * hardConnectionVector.dx
//             const hardConnectionY       = y + Block.Height * hardConnectionVector.dy
//             const hardConnectionIndex   = this.getIndex(hardConnectionX, hardConnectionY)
//             this.remove(hardConnectionIndex)
//         }
//         const debrisCount = Math.floor(Debris.CountMinimum + Math.random() * (Debris.CountMaximum - Debris.CountMinimum))
//         for (let i = 0; i < debrisCount; i++) {
//             this.debris.push(new Debris(block))
//         }
//     }
//     fall() {
//         const sortedBlocks = this.blocks.slice().sort((a, b) => b.y - a.y)
//         for (const block of sortedBlocks) {
//             if (block.grounded) continue
//             const index = this.getIndex(block.x, block.y)
//             this.setIndices(block.x, block.y, Block.Width, 1, Level.GridEmpty)
//             this.setIndices(block.x, block.y + Block.Height, Block.Width, 1, index)
//             block.y++
//         }
//         for (const walker of this.walkers) {
//             if (!walker.grounded) {
//                 walker.y++
//             }
//         }
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) {
//                 creeper.y++
//             }
//         }
//     }
//     walkersGrounded() {
//         for (const walker of this.walkers) {
//             if (!walker.grounded) return false
//         }
//         return true
//     }
//     creepersGrounded() {
//         for (const creeper of this.creepers) {
//             if (!creeper.grounded) return false
//         }
//         return true
//     }
//     groundWalkers() {
//         for (const walker of this.walkers) {
//             const y         = walker.y + Walker.Height
//             const xEast     = walker.x + Walker.Width - 1
//             const indexEast = this.getIndex(xEast, y)
//             if (indexEast !== Level.GridEmpty) {
//                 const block = this.blocks[indexEast]
//                 if (block.grounded && !block.ethereal) {
//                     walker.grounded = true
//                     continue
//                 }
//             }
//             const xWest     = walker.x
//             const indexWest = this.getIndex(xWest, y)
//             if (indexWest !== Level.GridEmpty) {
//                 const block = this.blocks[indexWest]
//                 if (block.grounded && !block.ethereal) {
//                     walker.grounded = true
//                     continue
//                 }
//             }
//             walker.grounded = false
//         }
//     }
//     groundCreepers() {
//         for (const creeper of this.creepers) {
//             const y         = creeper.y + Creeper.Height
//             const xEast     = creeper.x + Creeper.Width - 1
//             const indexEast = this.getIndex(xEast, y)
//             if (indexEast !== Level.GridEmpty) {
//                 const block = this.blocks[indexEast]
//                 if (block.grounded && !block.ethereal) {
//                     creeper.grounded = true
//                     continue
//                 }
//             }
//             const xWest     = creeper.x
//             const indexWest = this.getIndex(xWest, y)
//             if (indexWest !== Level.GridEmpty) {
//                 const block = this.blocks[indexWest]
//                 if (block.grounded && !block.ethereal) {
//                     creeper.grounded = true
//                     continue
//                 }
//             }
//             creeper.grounded = false
//         }
//     }
//     measureWalkerFalls() {
//         for (const walker of this.walkers) {
//             if (walker.falling) {
//                 if (walker.grounded) {
//                     walker.falling = false
//                     walker.fallStop = walker.y
//                 }
//             } else {
//                 if (!walker.grounded) {
//                     walker.falling = true
//                     walker.fallStart = walker.y
//                 }
//             }
//         }
//     }
//     blocksGrounded() {
//         for (const block of this.blocks) {
//             if (!block.grounded) return false
//         }
//         return true
//     }
//     groundBlocks() {
//         for (const block of this.blocks) {
//             block.grounded = false
//         }
//         for (const block of this.blocks) {
//             if (Block.TypeFalls[block.type]) continue
//             this.groundBlock(block)
//         }
//     }
//     groundBlock(block: Block) {
//         if (block.grounded) return
//         block.grounded = true
//         // Ground block above
//         if (block.y > 0) {
//             const index = this.getIndex(block.x, block.y - 1)
//             if (index !== Level.GridEmpty) {
//                 this.groundBlock(this.blocks[index])
//             }
//         }
//         // Ground connected blocks
//         for (let i = 0; i < Connection.DirectionCount; i++) {
//             const directionBit      = Connection.DirectionBits[i]
//             const hardConnection    = (block.hardConnections & directionBit) === directionBit
//             const softConnection    = (block.softConnections & directionBit) === directionBit
//             if (!hardConnection && !softConnection) continue
//             const connectionVector  = Connection.DirectionVectors[i]
//             const connectionX       = block.x + connectionVector.dx * Block.Width
//             const connectionY       = block.y + connectionVector.dy * Block.Height
//             const connectionIndex   = this.getIndex(connectionX, connectionY)
//             const connectionBlock   = this.blocks[connectionIndex]
//             this.groundBlock(connectionBlock)
//         }
//         // Ground magnet blocks
//         if (block.type === Block.Magnet) {
//             for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
//                 const magneticVector    = Connection.DirectionVectors[i]
//                 const magneticX         = block.x + magneticVector.dx * Block.Width
//                 const magneticY         = block.y + magneticVector.dy * Block.Height
//                 const magneticIndex     = this.getIndex(magneticX, magneticY)
//                 if (magneticIndex === Level.GridEmpty) continue
//                 const magneticBlock     = this.blocks[magneticIndex]
//                 if (magneticBlock.type !== Block.Magnet) continue
//                 if (magneticBlock.y !== magneticY) continue
//                 this.groundBlock(magneticBlock)
//             }
//         }
//     }
// }
