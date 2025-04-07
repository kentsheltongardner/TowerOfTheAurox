import Block from './block.js';
import Color from './color.js';
import Connection from './connection.js';
import Creeper from './creeper.js';
import Debris from './debris.js';
import Droplet from './droplet.js';
import Images from './images.js';
import Rect from './rect.js';
import RNG from './rng.js';
import Sounds from './sounds.js';
import Splash from './splash.js';
import Splatter from './splatter.js';
import Torch from './torch.js';
import Walker from './walker.js';
export default class Level {
    static GridEmpty = 0xffff;
    static GridWidth = 640;
    static GridHeight = 360;
    static GridCenterX = Level.GridWidth / 2;
    static GridCenterY = Level.GridHeight / 2;
    static BrickWidth = 40;
    static BrickHeight = 30;
    static CellCountX = Level.GridWidth / Block.Width;
    static CellCountY = Level.GridHeight / Block.Height;
    static MaxImmobilityVelocity = 0.5;
    static BlockElasticity = 0.3;
    static MoverElasticity = 0.2;
    static InfiniteMass = Number.MAX_SAFE_INTEGER;
    static ShakeMultiplier = 0.0005;
    levelData;
    camera;
    blocks = [];
    groups = []; // What blocks are in each group?
    groupIndex = []; // Which group does a block belong to? (indexed)
    groupContactsAbove = [];
    groupContactsBelow = [];
    groupFixedUp = [];
    groupFixedDown = [];
    hoverGroup = new Set(); // What blocks are in the hover group?
    torches = [];
    walkers = new Set();
    creepers = new Set();
    splatters = [];
    debris = [];
    indexGrid = new Uint16Array(Level.GridWidth * Level.GridWidth).fill(Level.GridEmpty);
    removalIndex = -1;
    deaths = 0;
    teleport = false;
    message = '';
    splashes = new Set();
    droplets = new Set();
    // public canvas:              HTMLCanvasElement   = document.createElement('canvas')
    // public lightCanvas:         HTMLCanvasElement   = document.createElement('canvas')
    // #         #####      #     ######   
    // #        #     #    # #    #     #  
    // #        #     #   #   #   #     #  
    // #        #     #  #######  #     #  
    // #        #     #  #     #  #     #  
    // #        #     #  #     #  #     #  
    // #######   #####   #     #  ######   
    constructor(levelData, camera) {
        this.levelData = levelData;
        this.camera = camera;
        // this.canvas.width           = Level.GridWidth
        // this.lightCanvas.width      = Level.GridWidth
        // this.canvas.height          = Level.GridHeight
        // this.lightCanvas.height     = Level.GridHeight
        this.load();
    }
    load() {
        const typeGrid = this.levelData.typeGrid;
        const attributeGrid = this.levelData.attributeGrid;
        const rowCount = typeGrid.length;
        const colCount = typeGrid[0].length;
        const flippedTypeGrid = flippedGrid(typeGrid);
        const blockGrid = Array.from({ length: Level.CellCountX }, () => new Array(Level.CellCountY).fill(null));
        // Flip type grid
        function flippedGrid(grid) {
            const newGrid = Array.from({ length: grid[0].length }, () => '');
            for (let i = 0; i < colCount; i++) {
                for (let j = 0; j < rowCount; j++) {
                    newGrid[i] += grid[j][i];
                }
            }
            return newGrid;
        }
        // Initial block types
        for (let i = 0; i < Level.CellCountX; i++) {
            const cellX = i * 2;
            for (let j = 0; j < Level.CellCountY; j++) {
                const cellY = j * 2;
                const char = flippedTypeGrid[cellX][cellY];
                const type = Block.CharToType[char];
                if (type === Block.None)
                    continue;
                const x = i * Block.Width;
                const y = j * Block.Height;
                const block = new Block(x, y, type);
                blockGrid[i][j] = block;
            }
        }
        // Add messages
        for (const message of this.levelData.messages) {
            const text = message[0];
            const x = message[1];
            const y = message[2];
            blockGrid[x][y].message = text;
        }
        // Set char attributes
        for (let i = 0; i < Level.CellCountY; i++) {
            const row = i * 2;
            const line = attributeGrid[row];
            const tokens = line.split(' ');
            for (let j = 0; j < Level.CellCountX; j++) {
                if (blockGrid[j][i] === null)
                    continue;
                const token = tokens[j];
                for (const char of token) {
                    blockGrid[j][i].setAttribute(char);
                }
            }
        }
        // Horizontal connections
        for (let i = 0; i < Level.CellCountX - 1; i++) {
            const cellX = i * 2 + 1;
            for (let j = 0; j < Level.CellCountY; j++) {
                const cellY = j * 2;
                const type = Connection.CharToConnection[flippedTypeGrid[cellX][cellY]];
                const self = blockGrid[i][j];
                const east = blockGrid[i + 1][j];
                switch (type) {
                    case Connection.Soft:
                        self.softConnections |= Connection.DirectionBits[Connection.East];
                        east.softConnections |= Connection.DirectionBits[Connection.West];
                        break;
                    case Connection.Hard:
                        self.hardConnections |= Connection.DirectionBits[Connection.East];
                        east.hardConnections |= Connection.DirectionBits[Connection.West];
                        break;
                }
            }
        }
        // Vertical connections
        for (let i = 0; i < Level.CellCountX; i++) {
            const cellX = i * 2;
            for (let j = 0; j < Level.CellCountY - 1; j++) {
                const cellY = j * 2 + 1;
                const type = Connection.CharToConnection[flippedTypeGrid[cellX][cellY]];
                const self = blockGrid[i][j];
                const south = blockGrid[i][j + 1];
                switch (type) {
                    case Connection.Soft:
                        self.softConnections |= Connection.DirectionBits[Connection.South];
                        south.softConnections |= Connection.DirectionBits[Connection.North];
                        break;
                    case Connection.Hard:
                        self.hardConnections |= Connection.DirectionBits[Connection.South];
                        south.hardConnections |= Connection.DirectionBits[Connection.North];
                        break;
                }
            }
        }
        // Corner connections
        for (let i = 0; i < Level.CellCountX - 1; i++) {
            const cellX = i * 2 + 1;
            for (let j = 0; j < Level.CellCountY - 1; j++) {
                const cellY = j * 2 + 1;
                const type = Connection.CharToConnection[flippedTypeGrid[cellX][cellY]];
                const self = blockGrid[i][j];
                const east = blockGrid[i + 1][j];
                const south = blockGrid[i][j + 1];
                const southeast = blockGrid[i + 1][j + 1];
                switch (type) {
                    case Connection.Soft:
                        self.softConnections |= Connection.DirectionBits[Connection.Southeast];
                        east.softConnections |= Connection.DirectionBits[Connection.Southwest];
                        south.softConnections |= Connection.DirectionBits[Connection.Northeast];
                        southeast.softConnections |= Connection.DirectionBits[Connection.Northwest];
                        break;
                    case Connection.Hard:
                        self.hardConnections |= Connection.DirectionBits[Connection.Southeast];
                        east.hardConnections |= Connection.DirectionBits[Connection.Southwest];
                        south.hardConnections |= Connection.DirectionBits[Connection.Northeast];
                        southeast.hardConnections |= Connection.DirectionBits[Connection.Northwest];
                        break;
                }
            }
        }
        // Add to array
        for (let i = 0; i < Level.CellCountX; i++) {
            for (let j = 0; j < Level.CellCountY; j++) {
                const block = blockGrid[i][j];
                if (block === null)
                    continue;
                this.blocks.push(block);
            }
        }
        // Add to grid
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            this.setIndices(block.x, block.y, Block.Width, Block.Height, i);
        }
        // Add walkers
        for (const walkerData of this.levelData.walkerData) {
            this.walkers.add(new Walker(walkerData[0], walkerData[1], walkerData[2]));
        }
        // Add creepers
        for (const creeperData of this.levelData.creeperData) {
            this.creepers.add(new Creeper(creeperData[0], creeperData[1], creeperData[2]));
        }
        // Add torches
        for (const torch of this.levelData.torches) {
            this.torches.push(new Torch(torch[0], torch[1]));
        }
    }
    setIndices(x, y, w, h, index) {
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                this.indexGrid[j * Level.GridWidth + i] = index;
            }
        }
    }
    getIndex(x, y) {
        return this.indexGrid[y * Level.GridWidth + x];
    }
    // ######   #######  #     #   #####   #     #  #######  
    // #     #  #        ##   ##  #     #  #     #  #        
    // #     #  #        # # # #  #     #  #     #  #        
    // ######   ####     #  #  #  #     #  #     #  ####     
    // #   #    #        #     #  #     #   #   #   #        
    // #    #   #        #     #  #     #    # #    #        
    // #     #  #######  #     #   #####      #     #######  
    // show 
    tap(gridX, gridY) {
        if (this.message !== '') {
            this.message = '';
            return;
        }
        if (gridX < 0 || gridY < 0 || gridX >= Level.GridWidth || gridY >= Level.GridHeight)
            return;
        const index = this.getIndex(gridX, gridY);
        if (index === Level.GridEmpty)
            return;
        const block = this.blocks[index];
        if (block.message !== '') {
            this.message = block.message;
        }
        if (!Block.TypeIsDestructible[block.type])
            return;
        this.remove(index);
        this.buildBlockGroups();
        this.hoverGroup.clear();
        Sounds.playBoom();
    }
    remove(index) {
        // Prevents recursion into deleted blocks
        if (index === Level.GridEmpty)
            return;
        const block = this.blocks[index];
        const x = block.x;
        const y = block.y;
        if (index !== this.blocks.length - 1) {
            const lastBlock = this.blocks[this.blocks.length - 1];
            this.blocks[index] = lastBlock;
            this.setIndices(lastBlock.x, lastBlock.y, Block.Width, Block.Height, index);
        }
        this.blocks.length--;
        this.setIndices(block.x, block.y, Block.Width, Block.Height, Level.GridEmpty);
        // Remove direct soft connections
        for (let i = 0; i < Connection.DirectionCount; i++) {
            if ((block.softConnections & Connection.DirectionBits[i]) === 0)
                continue;
            const softConnectionVector = Connection.DirectionVectors[i];
            const softConnectionX = x + Block.Width * softConnectionVector.dx;
            const softConnectionY = y + Block.Height * softConnectionVector.dy;
            const softConnectionIndex = this.getIndex(softConnectionX, softConnectionY);
            const softConnectionBlock = this.blocks[softConnectionIndex];
            const oppositeDirection = Connection.OppositeDirections[i];
            const oppositeDirectionBit = Connection.DirectionBits[oppositeDirection];
            softConnectionBlock.softConnections &= ~oppositeDirectionBit;
        }
        // Cache cardinal directions
        const softCardinalConnection = new Array(Connection.CardinalDirectionCount).fill(false);
        for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
            const directionBit = Connection.DirectionBits[i];
            softCardinalConnection[i] = (block.softConnections & directionBit) === directionBit;
        }
        // Remove adjacent diagonal soft connections
        for (let i = 0; i < Connection.CardinalDirectionCount; i++) {
            const directionA = i;
            if (!softCardinalConnection[directionA])
                continue;
            const directionB = (i + 1) % Connection.CardinalDirectionCount;
            if (!softCardinalConnection[directionB])
                continue;
            const vectorA = Connection.DirectionVectors[directionA];
            const vectorB = Connection.DirectionVectors[directionB];
            const xA = x + vectorA.dx * Block.Width;
            const xB = x + vectorB.dx * Block.Width;
            const yA = y + vectorA.dy * Block.Height;
            const yB = y + vectorB.dy * Block.Height;
            const indexA = this.getIndex(xA, yA);
            const indexB = this.getIndex(xB, yB);
            const blockA = this.blocks[indexA];
            const blockB = this.blocks[indexB];
            const diagonalA = (directionA + 1) % 4 + 4;
            const diagonalB = (directionB + 2) % 4 + 4;
            // (0, 1) -> (5, 7) or [1, 3]
            // (1, 2) -> (6, 4) or [2, 0]
            // (2, 3) -> (7, 5) or [3, 1]
            // (3, 0) -> (4, 6) or [0, 2]
            blockA.softConnections &= ~Connection.DirectionBits[diagonalA];
            blockB.softConnections &= ~Connection.DirectionBits[diagonalB];
        }
        // Propagate removal to all hard connections
        for (let i = 0; i < Connection.DirectionCount; i++) {
            const directionBit = Connection.DirectionBits[i];
            const hardConnection = (block.hardConnections & directionBit) === directionBit;
            if (!hardConnection)
                continue;
            const hardConnectionVector = Connection.DirectionVectors[i];
            const hardConnectionX = x + Block.Width * hardConnectionVector.dx;
            const hardConnectionY = y + Block.Height * hardConnectionVector.dy;
            const hardConnectionIndex = this.getIndex(hardConnectionX, hardConnectionY);
            this.remove(hardConnectionIndex);
        }
        const debrisCount = Math.floor(Debris.CountMinimum + Math.random() * (Debris.CountMaximum - Debris.CountMinimum));
        for (let i = 0; i < debrisCount; i++) {
            this.debris.push(new Debris(block));
        }
    }
    hover(gridX, gridY) {
        this.hoverGroup.clear();
        if (gridX < 0 || gridY < 0 || gridX >= Level.GridWidth || gridY >= Level.GridHeight)
            return;
        const index = this.getIndex(gridX, gridY);
        if (index === Level.GridEmpty)
            return;
        const block = this.blocks[index];
        if (block.message !== '') {
            this.hoverGroup.add(index);
            return;
        }
        if (!Block.TypeIsDestructible[block.type])
            return;
        this.buildHardGroup(gridX, gridY, this.hoverGroup);
    }
    //  #####   ######    #####   #     #  ######   
    // #     #  #     #  #     #  #     #  #     #  
    // #        #     #  #     #  #     #  #     #  
    // #        ######   #     #  #     #  ######   
    // #   ###  #   #    #     #  #     #  #        
    // #     #  #    #   #     #  #     #  #        
    //  #####   #     #   #####    #####   #        
    firstBlockInGroup(groupIndex) {
        return this.blocks[this.groups[groupIndex][0]];
    }
    setGroupVY(groupIndex, vy) {
        const group = this.groups[groupIndex];
        for (const blockIndex of group) {
            const block = this.blocks[blockIndex];
            block.vy = vy;
        }
    }
    //  Create an array of block groups, each block group containing indices of connected blocks
    buildBlockGroups() {
        this.groups = [];
        this.groupIndex.length = this.blocks.length;
        this.groupIndex.fill(-1);
        //  For physics purposes, all fixed blocks are in group zero
        const staticGroup = [];
        for (let i = 0; i < this.blocks.length; i++) {
            if (this.groupIndex[i] !== -1)
                continue;
            const block = this.blocks[i];
            if (Block.TypeFalls[block.type])
                continue;
            this.buildBlockGroup(block.x, block.y, 0, staticGroup);
        }
        this.groups.push(staticGroup);
        for (let i = 0; i < this.blocks.length; i++) {
            if (this.groupIndex[i] !== -1)
                continue;
            const block = this.blocks[i];
            const group = [];
            this.buildBlockGroup(block.x, block.y, this.groups.length, group);
            this.groups.push(group);
        }
    }
    buildBlockGroup(x, y, groupIndex, group) {
        const blockIndex = this.getIndex(x, y);
        if (blockIndex === Level.GridEmpty)
            return;
        if (this.groupIndex[blockIndex] !== -1)
            return;
        const block = this.blocks[blockIndex];
        this.groupIndex[blockIndex] = groupIndex;
        group.push(blockIndex);
        for (let i = 0; i < Connection.DirectionCount; i++) {
            const directionBit = Connection.DirectionBits[i];
            if ((block.softConnections & directionBit) === directionBit
                || (block.hardConnections & directionBit) === directionBit) {
                const vector = Connection.DirectionVectors[i];
                const connectedX = x + vector.dx * Block.Width;
                const connectedY = y + vector.dy * Block.Height;
                this.buildBlockGroup(connectedX, connectedY, groupIndex, group);
            }
        }
    }
    buildHardGroup(x, y, hardGroup) {
        const blockIndex = this.getIndex(x, y);
        if (blockIndex === Level.GridEmpty)
            return;
        if (hardGroup.has(blockIndex))
            return;
        hardGroup.add(blockIndex);
        const block = this.blocks[blockIndex];
        for (let i = 0; i < Connection.DirectionCount; i++) {
            const directionBit = Connection.DirectionBits[i];
            if ((block.hardConnections & directionBit) === directionBit) {
                const vector = Connection.DirectionVectors[i];
                const connectedX = x + vector.dx * Block.Width;
                const connectedY = y + vector.dy * Block.Height;
                this.buildHardGroup(connectedX, connectedY, hardGroup);
            }
        }
    }
    // Establish contacts between all groups
    buildGroupContacts() {
        // Initialize group contacts
        const groupCount = this.groups.length;
        const groupContactsAbove = new Array(groupCount).fill(null).map(() => new Set());
        const groupContactsBelow = new Array(groupCount).fill(null).map(() => new Set());
        this.groupContactsAbove = new Array(groupCount).fill(null).map(() => []);
        this.groupContactsBelow = new Array(groupCount).fill(null).map(() => []);
        // Find all contacts
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            const groupIndex = this.groupIndex[i];
            const x = block.x;
            const y = block.y - 1;
            if (y < 0)
                continue;
            const blockIndexAbove = this.getIndex(x, y);
            if (blockIndexAbove === Level.GridEmpty)
                continue;
            const groupIndexAbove = this.groupIndex[blockIndexAbove];
            if (groupIndexAbove === groupIndex)
                continue;
            groupContactsAbove[groupIndex].add(groupIndexAbove);
            groupContactsBelow[groupIndexAbove].add(groupIndex);
        }
        // Store contact sets as arrays
        for (let i = 0; i < groupCount; i++) {
            this.groupContactsAbove[i] = Array.from(groupContactsAbove[i]);
            this.groupContactsBelow[i] = Array.from(groupContactsBelow[i]);
        }
    }
    buildGroupImmobility() {
        const propagateImmobility = (groupIndex, groupContacts, groupFixed) => {
            if (groupFixed[groupIndex])
                return;
            const firstBlock = this.firstBlockInGroup(groupIndex);
            if (firstBlock.vy > Level.MaxImmobilityVelocity)
                return;
            if (firstBlock.vy < -Level.MaxImmobilityVelocity)
                return;
            groupFixed[groupIndex] = true;
            this.setGroupVY(groupIndex, 0);
            const contacts = groupContacts[groupIndex];
            for (const contact of contacts) {
                propagateImmobility(contact, groupContacts, groupFixed);
            }
        };
        const groupCount = this.groups.length;
        this.groupFixedUp = new Array(groupCount).fill(false);
        this.groupFixedDown = new Array(groupCount).fill(false);
        // First group contains all fixed blocks
        // Upward contacts cannot move down, downward contacts cannot move up
        propagateImmobility(0, this.groupContactsAbove, this.groupFixedDown);
        propagateImmobility(0, this.groupContactsBelow, this.groupFixedUp);
    }
    performGrouping() {
        this.buildBlockGroups();
        this.buildGroupContacts();
        this.buildGroupImmobility();
    }
    //  #####   ######    #####   #     #  #     #  ######   
    // #     #  #     #  #     #  #     #  ##    #  #     #  
    // #        #     #  #     #  #     #  # #   #  #     #  
    // #        ######   #     #  #     #  #  #  #  #     #  
    // #   ###  #   #    #     #  #     #  #   # #  #     #  
    // #     #  #    #   #     #  #     #  #    ##  #     #  
    //  #####   #     #   #####    #####   #     #  ######   
    groundMovers() {
        const moverGrounded = (mover) => {
            // if (mover.vy !== 0) return false
            const floorY = mover.y + mover.height();
            const westFootX = mover.x;
            const eastFootX = mover.x + mover.width() - 1;
            const westFloorIndex = this.getIndex(westFootX, floorY);
            const eastFloorIndex = this.getIndex(eastFootX, floorY);
            const westFloor = westFloorIndex !== Level.GridEmpty;
            const eastFloor = eastFloorIndex !== Level.GridEmpty;
            if (!westFloor && !eastFloor)
                return false;
            if (westFloor) {
                const westGroupIndex = this.groupIndex[westFloorIndex];
                if (this.groupFixedDown[westGroupIndex])
                    return true;
            }
            if (eastFloor) {
                const eastGroupIndex = this.groupIndex[eastFloorIndex];
                if (this.groupFixedDown[eastGroupIndex])
                    return true;
            }
            return false;
        };
        for (const walker of this.walkers) {
            walker.grounded = moverGrounded(walker);
        }
        for (const creeper of this.creepers) {
            creeper.grounded = moverGrounded(creeper);
        }
    }
    //  #####    #####   #     #  ######      #     ######   #######  
    // #     #  #     #  ##   ##  #     #    # #    #     #  #        
    // #        #     #  # # # #  #     #   #   #   #     #  #        
    // #        #     #  #  #  #  ######   #######  ######   ####     
    // #        #     #  #     #  #        #     #  #   #    #        
    // #     #  #     #  #     #  #        #     #  #    #   #        
    //  #####    #####   #     #  #        #     #  #     #  #######  
    compare(num1, den1, num2, den2) {
        return num1 * den2 - num2 * den1;
    }
    //  #####   #     #  #######  ######   #           #     ######   
    // #     #  #     #  #        #     #  #          # #    #     #  
    // #     #  #     #  #        #     #  #         #   #   #     #  
    // #     #  #     #  ####     ######   #        #######  ######   
    // #     #   #   #   #        #   #    #        #     #  #        
    // #     #    # #    #        #    #   #        #     #  #        
    //  #####      #     #######  #     #  #######  #     #  #        
    overlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 >= x2 + w2
            || y1 >= y2 + h2
            || x2 >= x1 + w1
            || y2 >= y1 + h1);
    }
    headOverlap(x, y, w, h) {
        return this.getIndex(x, y) !== Level.GridEmpty
            || this.getIndex(x + w - 1, y) !== Level.GridEmpty;
    }
    footOverlap(x, y, w, h) {
        const footY = y + h - 1;
        return this.getIndex(x, footY) !== Level.GridEmpty
            || this.getIndex(x + w - 1, footY) !== Level.GridEmpty;
    }
    // #     #  ######   ######      #     #######  #######  
    // #     #  #     #  #     #    # #       #     #        
    // #     #  #     #  #     #   #   #      #     #        
    // #     #  ######   #     #  #######     #     ####     
    // #     #  #        #     #  #     #     #     #        
    // #     #  #        #     #  #     #     #     #        
    //  #####   #        ######   #     #     #     #######  
    update(frame) {
        //    #      #####    #####   #######  #        #######  ######      #     #######  #######  
        //   # #    #     #  #     #  #        #        #        #     #    # #       #     #        
        //  #   #   #        #        #        #        #        #     #   #   #      #     #        
        // #######  #        #        ####     #        ####     ######   #######     #     ####     
        // #     #  #        #        #        #        #        #   #    #     #     #     #        
        // #     #  #     #  #     #  #        #        #        #    #   #     #     #     #        
        // #     #   #####    #####   #######  #######  #######  #     #  #     #     #     #######  
        // Prepare block groupings and contacts, ground movers, and increment y-velocities
        this.performGrouping();
        this.groundMovers();
        const groupCount = this.groups.length;
        for (let i = 0; i < groupCount; i++) {
            if (this.groupFixedDown[i])
                continue;
            const group = this.groups[i];
            for (let j = 0; j < group.length; j++) {
                const blockIndex = group[j];
                const block = this.blocks[blockIndex];
                block.vy += 0.75;
            }
        }
        for (const walker of this.walkers) {
            if (!walker.grounded) {
                walker.vy += 0.6;
            }
        }
        for (const creeper of this.creepers) {
            if (!creeper.grounded) {
                creeper.vy += 0.6;
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
        const step = new Array(groupCount);
        const stepTotal = new Array(groupCount);
        const direction = new Array(groupCount);
        const vy = new Array(groupCount);
        for (let i = 0; i < groupCount; i++) {
            const group = this.groups[i];
            const block = this.blocks[group[0]];
            step[i] = 1;
            vy[i] = Math.floor(block.vy);
            stepTotal[i] = Math.abs(vy[i]);
            direction[i] = Math.sign(vy[i]);
        }
        for (const walker of this.walkers) {
            walker.setStepVariables();
        }
        for (const creeper of this.creepers) {
            creeper.setStepVariables();
        }
        // #         #####    #####   ######   
        // #        #     #  #     #  #     #  
        // #        #     #  #     #  #     #  
        // #        #     #  #     #  ######   
        // #        #     #  #     #  #        
        // #        #     #  #     #  #        
        // #######   #####    #####   #        
        while (true) {
            this.performGrouping();
            this.groundMovers();
            // #     #     #     ######   #######     #     ######   #        #######   #####   
            // #     #    # #    #     #     #       # #    #     #  #        #        #     #  
            // #     #   #   #   #     #     #      #   #   #     #  #        #        #        
            // #     #  #######  ######      #     #######  ######   #        ####      #####   
            //  #   #   #     #  #   #       #     #     #  #     #  #        #              #  
            //   # #    #     #  #    #      #     #     #  #     #  #        #        #     #  
            //    #     #     #  #     #  #######  #     #  ######   #######  #######   #####   
            // Variables nextStep, nextStepTotal and nextDirection indicate which cohorts of 
            // objects will attempt a move. Downward movements are prioritized.
            let nextStep = Number.MAX_SAFE_INTEGER;
            let nextStepTotal = 1;
            let nextDirection = -1;
            const updateStepVariables = (step, stepTotal, direction) => {
                const comparison = this.compare(step, stepTotal, nextStep, nextStepTotal);
                if (comparison > 0)
                    return;
                if (comparison < 0) {
                    nextDirection = direction;
                }
                else if (direction === 1) {
                    nextDirection = 1;
                }
                nextStep = step;
                nextStepTotal = stepTotal;
            };
            for (let i = 0; i < groupCount; i++) {
                updateStepVariables(step[i], stepTotal[i], direction[i]);
            }
            for (const walker of this.walkers) {
                updateStepVariables(walker.step, walker.stepTotal, walker.fallDirection);
            }
            for (const creeper of this.creepers) {
                updateStepVariables(creeper.step, creeper.stepTotal, creeper.fallDirection);
            }
            if (nextStep > nextStepTotal)
                break;
            // #     #   #####   #     #  #######  ######    #####   
            // ##   ##  #     #  #     #  #        #     #  #     #  
            // # # # #  #     #  #     #  #        #     #  #        
            // #  #  #  #     #  #     #  ####     ######    #####   
            // #     #  #     #   #   #   #        #   #          #  
            // #     #  #     #    # #    #        #    #   #     #  
            // #     #   #####      #     #######  #     #   #####   
            // Identify all potential movers whose step, stepTotal, and direction match the next step
            const movingGroups = new Set;
            const movingWalkers = new Set;
            const movingCreepers = new Set;
            for (let i = 0; i < groupCount; i++) {
                if (this.compare(step[i], stepTotal[i], nextStep, nextStepTotal) !== 0)
                    continue;
                if (direction[i] !== nextDirection)
                    continue;
                movingGroups.add(i);
            }
            for (const walker of this.walkers) {
                if (this.compare(walker.step, walker.stepTotal, nextStep, nextStepTotal) !== 0)
                    continue;
                if (walker.fallDirection !== nextDirection)
                    continue;
                // if (walker.grounded)                                                            continue
                movingWalkers.add(walker);
            }
            for (const creeper of this.creepers) {
                if (this.compare(creeper.step, creeper.stepTotal, nextStep, nextStepTotal) !== 0)
                    continue;
                if (creeper.fallDirection !== nextDirection)
                    continue;
                // if (creeper.grounded)                                                               continue
                movingCreepers.add(creeper);
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
            const buildCollisionSetAbove = (group, collisionSet) => {
                if (collisionSet.has(group))
                    return;
                collisionSet.add(group);
                const contacts = this.groupContactsAbove[group];
                for (const groupAbove of contacts) {
                    if (vy[groupAbove] === vy[group]) {
                        buildCollisionSetAbove(groupAbove, collisionSet);
                    }
                }
            };
            const buildCollisionSetBelow = (group, collisionSet) => {
                if (collisionSet.has(group))
                    return;
                collisionSet.add(group);
                const contacts = this.groupContactsBelow[group];
                for (const groupBelow of contacts) {
                    if (vy[groupBelow] === vy[group]) {
                        buildCollisionSetBelow(groupBelow, collisionSet);
                    }
                }
            };
            const mergedCollisionSets = (collisionSets) => {
                let mergedSets = [];
                for (const collisionSet of collisionSets) {
                    let merged = new Set(collisionSet);
                    let hasMerged = false;
                    for (let i = 0; i < mergedSets.length; i++) {
                        if ([...merged].some(group => mergedSets[i].has(group))) {
                            for (const group of merged) {
                                mergedSets[i].add(group);
                            }
                            merged = mergedSets[i];
                            hasMerged = true;
                        }
                    }
                    if (!hasMerged) {
                        mergedSets.push(merged);
                    }
                    else {
                        mergedSets = mergedCollisionSets(mergedSets);
                        break;
                    }
                }
                return mergedSets;
            };
            const collisionSets = [];
            for (let group = 0; group < groupCount; group++) {
                const collisionSet = new Set();
                collisionSet.add(group);
                const contactsAbove = this.groupContactsAbove[group];
                for (const groupAbove of contactsAbove) {
                    if (vy[groupAbove] > vy[group]) {
                        buildCollisionSetAbove(groupAbove, collisionSet);
                        // collisionSet.add(groupAbove)
                    }
                }
                const contactsBelow = this.groupContactsBelow[group];
                for (const groupBelow of contactsBelow) {
                    if (vy[groupBelow] < vy[group]) {
                        buildCollisionSetBelow(groupBelow, collisionSet);
                        // collisionSet.add(groupBelow)
                    }
                }
                if (collisionSet.size > 1) {
                    collisionSets.push(collisionSet);
                }
            }
            const collisionGroups = mergedCollisionSets(collisionSets);
            for (const collisionGroup of collisionGroups) {
                for (const group of collisionGroup) {
                    movingGroups.delete(group);
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
            const groupFixed = nextDirection === 1 ? this.groupFixedDown : this.groupFixedUp;
            for (const collisionGroup of collisionGroups) {
                const collisionGroupCount = collisionGroup.size;
                const e = Level.BlockElasticity + 1;
                const vi = new Array(collisionGroupCount);
                const m = new Array(collisionGroupCount);
                let totalMass = 0;
                let fixedCollision = false;
                for (const groupIndex of collisionGroup) {
                    const group = this.groups[groupIndex];
                    vi[groupIndex] = this.firstBlockInGroup(groupIndex).vy;
                    m[groupIndex] = group.length;
                    totalMass += m[groupIndex];
                    if (groupFixed[groupIndex]) {
                        fixedCollision = true;
                    }
                }
                if (fixedCollision) {
                    totalMass = 0;
                    for (const groupIndex of collisionGroup) {
                        if (groupFixed[groupIndex]) {
                            m[groupIndex] = 1;
                            totalMass++;
                        }
                        else {
                            m[groupIndex] = 0;
                        }
                    }
                }
                for (const groupIndex of collisionGroup) {
                    let weightedMasses = 0;
                    for (const otherIndex of collisionGroup) {
                        if (groupIndex === otherIndex)
                            continue;
                        weightedMasses += m[otherIndex] * (vi[groupIndex] - vi[otherIndex]);
                    }
                    const vf = Math.trunc(vi[groupIndex] - (e * weightedMasses) / totalMass);
                    const dy = Math.abs(vf - vy[groupIndex]);
                    this.camera.shake(dy * dy * this.groups[groupIndex].length * Level.ShakeMultiplier); // Mass has been adjusted, use group size instead
                    this.setGroupVY(groupIndex, vf);
                    vy[groupIndex] = vf;
                    stepTotal[groupIndex] = Math.abs(vf);
                    direction[groupIndex] = Math.sign(vf);
                    if (stepTotal[groupIndex] === 0) {
                        step[groupIndex] = 2;
                        stepTotal[groupIndex] = 1;
                    }
                    else {
                        step[groupIndex] = Math.ceil(stepTotal[groupIndex] * nextStep / nextStepTotal);
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
                const contacts = nextDirection === 1 ? this.groupContactsBelow[groupIndex] : this.groupContactsAbove[groupIndex];
                for (const contact of contacts) {
                    if (!movingGroups.has(contact)) {
                        step[groupIndex]++;
                        movingGroups.delete(groupIndex);
                        break;
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
                const group = this.groups[groupIndex];
                for (const blockIndex of group) {
                    const block = this.blocks[blockIndex];
                    this.setIndices(block.x, block.y, Block.Width, Block.Height, Level.GridEmpty);
                }
            }
            for (const groupIndex of movingGroups) {
                const group = this.groups[groupIndex];
                for (const blockIndex of group) {
                    const block = this.blocks[blockIndex];
                    block.y += nextDirection;
                    this.setIndices(block.x, block.y, Block.Width, Block.Height, blockIndex);
                }
                step[groupIndex]++;
            }
            this.fireBeams();
            // #     #  #######  #######  
            // #     #     #        #     
            // #     #     #        #     
            // #######     #        #     
            // #     #     #        #     
            // #     #     #        #     
            // #     #  #######     #     
            for (const walker of movingWalkers) {
                walker.y += nextDirection;
                walker.step++;
            }
            for (const creeper of movingCreepers) {
                creeper.y += nextDirection;
                creeper.step++;
            }
            // ######    #####   #     #  #     #   #####   #######  
            // #     #  #     #  #     #  ##    #  #     #  #        
            // #     #  #     #  #     #  # #   #  #        #        
            // ######   #     #  #     #  #  #  #  #        ####     
            // #     #  #     #  #     #  #   # #  #        #        
            // #     #  #     #  #     #  #    ##  #     #  #        
            // ######    #####    #####   #     #   #####   #######  
            const bounce = (mover, moverSet) => {
                const head = mover.y;
                const above = head - 1;
                const below = head + mover.height();
                const foot = below - 1;
                const west = mover.x;
                const east = west + mover.width() - 1;
                const blockEastFoot = this.getIndex(east, foot);
                const blockWestFoot = this.getIndex(west, foot);
                const blockEastHead = this.getIndex(east, head);
                const blockWestHead = this.getIndex(west, head);
                const blockEastBelow = this.getIndex(east, below);
                const blockWestBelow = this.getIndex(west, below);
                const blockEastAbove = this.getIndex(east, above);
                const blockWestAbove = this.getIndex(west, above);
                const overlapEastFoot = blockEastFoot !== Level.GridEmpty;
                const overlapWestFoot = blockWestFoot !== Level.GridEmpty;
                const overlapEastHead = blockEastHead !== Level.GridEmpty;
                const overlapWestHead = blockWestHead !== Level.GridEmpty;
                const contactEastBelow = blockEastBelow !== Level.GridEmpty;
                const contactWestBelow = blockWestBelow !== Level.GridEmpty;
                const contactWestAbove = blockWestAbove !== Level.GridEmpty;
                const contactEastAbove = blockEastAbove !== Level.GridEmpty;
                const overlapFoot = overlapEastFoot || overlapWestFoot;
                const overlapHead = overlapEastHead || overlapWestHead;
                if (!overlapFoot && !overlapHead)
                    return;
                const contactBelow = contactEastBelow || contactWestBelow;
                const contactAbove = contactEastAbove || contactWestAbove;
                const squish = (overlapFoot && contactAbove) || (overlapHead && contactBelow);
                let vy = 0;
                if (overlapFoot) {
                    mover.y--;
                    if (overlapEastFoot && overlapWestFoot) {
                        vy = Math.min(this.blocks[blockEastFoot].vy, this.blocks[blockWestFoot].vy);
                    }
                    else {
                        vy = overlapEastFoot ? this.blocks[blockEastFoot].vy : this.blocks[blockWestFoot].vy;
                    }
                    if (vy >= mover.vy) {
                        return;
                    }
                }
                else if (overlapHead) {
                    mover.y++;
                    if (overlapEastHead && overlapWestHead) {
                        vy = Math.min(this.blocks[blockEastHead].vy, this.blocks[blockWestHead].vy);
                    }
                    else {
                        vy = overlapEastHead ? this.blocks[blockEastHead].vy : this.blocks[blockWestHead].vy;
                    }
                    if (vy <= mover.vy) {
                        return;
                    }
                }
                const vyf = Math.trunc(mover.vy + (1 + Level.MoverElasticity) * (vy - mover.vy));
                const acceleration = Math.abs(vyf - mover.vy);
                mover.vy = vyf;
                mover.stepTotal = Math.abs(mover.vy);
                mover.fallDirection = Math.sign(mover.vy);
                if (mover.stepTotal === 0) {
                    mover.step = 2;
                    mover.stepTotal = 1;
                }
                else {
                    mover.step = Math.ceil(mover.stepTotal * nextStep / nextStepTotal);
                }
                if (squish || (mover instanceof Walker && acceleration > 9)) {
                    this.splatterMover(mover, mover.vy * 0.125);
                    this.kill(mover, moverSet);
                    Sounds.playSplat();
                }
            };
            this.fireBeams();
            this.eat();
            //  #####    #####   #     #  #######   #####   #     #  
            // #     #  #     #  #     #     #     #     #  #     #  
            // #        #     #  #     #     #     #        #     #  
            //  #####   #  #  #  #     #     #      #####   #######  
            //       #  #   # #  #     #     #           #  #     #  
            // #     #  #    #   #     #     #     #     #  #     #  
            //  #####    #### #   #####   #######   #####   #     #  
            for (const walker of this.walkers) {
                bounce(walker, this.walkers);
            }
            for (const creeper of this.creepers) {
                bounce(creeper, this.creepers);
            }
        }
        if (frame % 2 === 0) {
            this.performGrouping();
            this.groundMovers();
            const walk = (mover) => {
                let xFront = 0;
                let xBack = 0;
                let xNext = 0;
                if (mover.vx === 1) {
                    xBack = mover.x;
                    xNext = xBack + mover.width();
                    xFront = xNext + 1;
                }
                else {
                    xFront = mover.x;
                    xBack = xFront + mover.width() - 1;
                    xNext = xFront - 1;
                }
                // const x 
                // const nextX         = mover.vx === 1 ? mover.x + mover.width() : mover.x - 1
                // const backX         = mover.vx === 1 ? mover.x : mover.x + mover.width() - 1
                const head = mover.y;
                const floor = head + mover.height();
                const foot = floor - 1;
                const blockHead = this.getIndex(xNext, head) !== Level.GridEmpty;
                const blockFoot = this.getIndex(xNext, foot) !== Level.GridEmpty;
                const emptyFloor = this.getIndex(xNext, floor) === Level.GridEmpty;
                const backIndex = this.getIndex(xBack, floor);
                const frontIndex = this.getIndex(xFront, floor);
                const slide = (backIndex !== Level.GridEmpty && this.blocks[backIndex].type === Block.Ice)
                    || (frontIndex !== Level.GridEmpty && this.blocks[frontIndex].type === Block.Ice);
                if (blockHead || blockFoot || (emptyFloor && mover.grounded && !slide)) {
                    mover.walkDirection *= -1;
                    mover.vx *= -1;
                }
                else {
                    const middleX = mover.x + Walker.Width / 2;
                    const middleBlockIndex = this.getIndex(middleX, floor);
                    if (mover instanceof Walker
                        && mover.grounded
                        && middleBlockIndex !== Level.GridEmpty
                        && middleX % Block.Width === Block.Width / 2) {
                        const block = this.blocks[middleBlockIndex];
                        if (block.altar) {
                            this.walkers.delete(mover);
                            Sounds.playVanish();
                            return;
                        }
                        else if (block.warp) {
                            for (const pair of this.blocks) {
                                if (!pair.warp)
                                    continue;
                                if (pair === block)
                                    continue;
                                if (pair.color !== block.color)
                                    continue;
                                if (this.getIndex(pair.x, pair.y - Walker.Height) !== Level.GridEmpty)
                                    continue;
                                mover.y = pair.y - Walker.Height;
                                mover.x = pair.x + (mover.x - block.x);
                                Sounds.playWhoosh();
                                break;
                            }
                        }
                    }
                    if (slide) {
                        mover.walkDirection *= -1;
                    }
                    else {
                        mover.walkDirection = mover.vx;
                    }
                    mover.x += mover.vx;
                }
            };
            for (const walker of this.walkers) {
                walk(walker);
            }
            for (const creeper of this.creepers) {
                walk(creeper);
            }
            this.fireBeams();
            this.eat();
        }
        this.createDroplets();
        this.updateSplatters();
        this.updateDebris();
        this.updateDroplets();
        this.updateSplashes();
    }
    complete() {
        return this.deaths === 0 && this.walkers.size === 0;
    }
    kill(mover, moverSet) {
        moverSet.delete(mover);
        if (mover instanceof Walker) {
            this.deaths++;
        }
    }
    lift() {
        for (const block of this.blocks) {
            if (!block.altar)
                continue;
            const blockLeft = block.x;
            const blockRight = blockLeft + Block.Width - 1;
            const blockTop = block.y;
            for (const walker of this.walkers) {
                const left = walker.x;
                const right = left + Walker.Width - 1;
                const floor = walker.y + Walker.Height;
                if (floor === blockTop && left >= blockLeft && right <= blockRight) {
                    this.walkers.delete(walker);
                }
            }
        }
    }
    beamIntersects(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 > x2 + w2
            || y1 > y2 + h2
            || x2 > x1 + w1
            || y2 > y1 + h1);
    }
    beams() {
        const beams = [];
        for (const block of this.blocks) {
            if (block.type !== Block.Beam)
                continue;
            const x = block.x + Block.Width / 2;
            const y = block.y + Block.Height / 2;
            const beam = this.beam(x, y, block.direction);
            beams.push(beam);
        }
        return beams;
    }
    beam(x, y, direction) {
        switch (direction) {
            case Connection.East: {
                let impactX = Level.GridWidth - 1;
                for (const block of this.blocks) {
                    const xw = block.x;
                    const yn = block.y;
                    const ys = yn + Block.Height - 1;
                    if (xw > x && xw < impactX && y >= yn && y <= ys) {
                        impactX = xw;
                    }
                }
                return new Rect(x, y, impactX - x, 0);
            }
            case Connection.West: {
                let impactX = 0;
                for (const block of this.blocks) {
                    const xe = block.x + Block.Width;
                    const yn = block.y;
                    const ys = yn + Block.Height - 1;
                    if (xe < x && xe > impactX && y >= yn && y <= ys) {
                        impactX = xe;
                    }
                }
                return new Rect(impactX, y, x - impactX, 0);
            }
            case Connection.South: {
                let impactY = Level.GridHeight - 1;
                for (const block of this.blocks) {
                    const yn = block.y;
                    const xw = block.x;
                    const xe = xw + Block.Width - 1;
                    if (yn > y && yn < impactY && x >= xw && x <= xe) {
                        impactY = yn;
                    }
                }
                return new Rect(x, y, 0, impactY - y);
            }
            case Connection.North: {
                let impactY = 0;
                for (const block of this.blocks) {
                    const ys = block.y + Block.Height;
                    const xw = block.x;
                    const xe = xw + Block.Width - 1;
                    if (ys < y && ys > impactY && x >= xw && x <= xe) {
                        impactY = ys;
                    }
                }
                return new Rect(x, impactY, 0, y - impactY);
            }
        }
        return new Rect(x, y, 0, 0);
    }
    fireBeam(beam, mover, moverSet) {
        if (this.beamIntersects(beam.x, beam.y, beam.w, beam.h, mover.x, mover.y, mover.width(), mover.height())) {
            this.splatterMover(mover, mover.vy);
            this.kill(mover, moverSet);
            Sounds.playZap();
        }
    }
    fireBeams() {
        const beams = this.beams();
        for (const beam of beams) {
            for (const walker of this.walkers) {
                this.fireBeam(beam, walker, this.walkers);
            }
            for (const creeper of this.creepers) {
                this.fireBeam(beam, creeper, this.creepers);
            }
        }
    }
    eat() {
        for (const creeper of this.creepers) {
            for (const walker of this.walkers) {
                if (this.contact(creeper, walker)) {
                    this.splatterMover(walker, walker.vy);
                    this.kill(walker, this.walkers);
                    Sounds.playSplat();
                }
            }
        }
    }
    contact(creeper, walker) {
        return !(creeper.x + Creeper.Width <= walker.x
            || walker.x + Walker.Width <= creeper.x
            || creeper.y + Creeper.Height <= walker.y
            || walker.y + Walker.Height <= creeper.y);
    }
    splatterMover(mover, vyScalar) {
        const count = Splatter.CountMinimum + Math.floor(Splatter.CountMaximum - Splatter.CountMinimum);
        const x = mover.x + mover.width() / 2;
        const y = mover.y + mover.height();
        for (let i = 0; i < count; i++) {
            this.splatters.push(new Splatter(x, y, vyScalar));
        }
    }
    updateDebris() {
        for (const debris of this.debris) {
            debris.vy += Debris.FallSpeed;
            debris.x += debris.vx;
            debris.y += debris.vy;
            debris.frame++;
        }
        this.debris = this.debris.filter(debris => debris.y < Level.GridHeight);
    }
    updateSplatters() {
        for (const splatter of this.splatters) {
            splatter.vy += Splatter.FallSpeed;
            splatter.x += splatter.vx;
            splatter.y += splatter.vy;
            const x = Math.floor(splatter.x);
            const y = Math.floor(splatter.y);
            if (x < 0 || y < 0 || x >= Level.GridWidth || y > Level.GridHeight)
                continue;
            const index = this.getIndex(x, y);
            if (index !== Level.GridEmpty && Math.random() > 0.5) {
                splatter.splattered = true;
                const block = this.blocks[index];
                const blockX = x - block.x;
                const blockY = y - block.y;
                splatter.x = blockX;
                splatter.y = blockY;
                block.splatters.push(splatter);
            }
        }
        this.splatters = this.splatters.filter(splatter => splatter.y < Level.GridHeight && !splatter.splattered);
    }
    createDroplets() {
        if (Math.random() > 0.6)
            return;
        // Find a stationary block that has room underneath it to create a drop
        let dropletBlocks = [];
        for (const block of this.blocks) {
            if (Block.TypeFalls[block.type])
                continue;
            const y = block.y + Block.Height;
            if (block.y === Level.GridHeight - Block.Height)
                continue;
            if (this.getIndex(block.x, y) !== Level.GridEmpty)
                continue;
            dropletBlocks.push(block);
        }
        const count = dropletBlocks.length;
        if (count === 0)
            return;
        const block = dropletBlocks[Math.floor(Math.random() * count)];
        const y = block.y + Block.Height;
        const x = block.x + Math.floor(Math.random() * Block.Width);
        this.droplets.add(new Droplet(x, y));
    }
    updateDroplets() {
        for (const droplet of this.droplets) {
            droplet.vy += 0.3;
            droplet.y += droplet.vy;
            const x = Math.floor(droplet.x);
            let y = Math.floor(droplet.y);
            if (droplet.y >= Level.GridHeight || this.getIndex(x, y) !== Level.GridEmpty) {
                this.droplets.delete(droplet);
                let index = this.getIndex(x, y);
                let validIndex = index;
                while (index !== Level.GridEmpty) {
                    validIndex = index;
                    y--;
                    index = this.getIndex(x, y);
                }
                const block = this.blocks[validIndex];
                const splashCount = 6 + Math.floor(Math.random() * 3);
                for (let i = 0; i < splashCount; i++) {
                    const speed = 1.0 + Math.random() * 0.5;
                    const theta = Math.PI + Math.random() * Math.PI;
                    const vx = Math.cos(theta) * speed;
                    const vy = Math.sin(theta) * speed + block.vy;
                    const splash = new Splash(x, y, vx, vy);
                    this.splashes.add(splash);
                }
                // Sounds.playSplash()
            }
        }
    }
    updateSplashes() {
        for (const splash of this.splashes) {
            splash.vy += 0.3;
            splash.y += splash.vy;
            splash.x += splash.vx;
            splash.frames++;
            const x = Math.floor(splash.x);
            const y = Math.floor(splash.y);
            if (splash.y >= Level.GridHeight || this.getIndex(x, y) !== Level.GridEmpty) {
                this.splashes.delete(splash);
            }
        }
    }
    static SplatterRGB = '#9f040460';
    static DebrisRGBPrefix = 'rgba(115, 65, 32, ';
    smooth(x) {
        const sin = Math.sin(Math.PI * x / 2);
        return sin * sin;
    }
    renderBricks(context, offsetY) {
        const rng = new RNG();
        const brickWidth = Block.Width * 2;
        context.fillStyle = 'black';
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        for (let j = 0; j < Level.CellCountY; j++) {
            const y = j * Block.Height + offsetY;
            for (let i = j % 2 === 0 ? -1 : 0; i < Level.CellCountX; i += 2) {
                const x = i * Block.Width;
                context.drawImage(Images.Bricks, brickWidth * (rng.nextInt() % 3), 0, brickWidth, Block.Height, x, y, brickWidth, Block.Height);
            }
        }
    }
    renderTorches(context, offsetY, frame) {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        const rng = new RNG(frame);
        for (const torch of this.torches) {
            const offsetX = Math.floor((frame + torch.frame) / 2) % 5 * Block.Width;
            context.drawImage(Images.Torch, offsetX, 0, Block.Width, Block.Height, torch.x, torch.y + offsetY, Block.Width, Block.Height);
        }
        for (const torch of this.torches) {
            const radius = 35 + rng.nextFloat() * 3;
            const diameter = radius * 2;
            const cx = torch.x + Block.Width / 2 + rng.nextFloat() * 2 - 1;
            const cy = torch.y + Block.Height / 2 + rng.nextFloat() * 2 - 1;
            const gradient = context.createRadialGradient(cx, cy + offsetY, 0, cx, cy + offsetY, radius);
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.2)');
            gradient.addColorStop(0.5, 'rgba(255, 128, 0, 0.015)');
            gradient.addColorStop(0.75, 'rgba(255, 0, 0, 0.01)');
            gradient.addColorStop(1, 'rgba(128, 0, 0, 0)');
            context.fillStyle = gradient;
            context.fillRect(cx - radius, cy - radius + offsetY, diameter, diameter);
        }
    }
    renderBeams(context, offsetY, frame) {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        const beamIntensity = 0.5 + 0.5 * this.smooth(frame * 0.075);
        context.strokeStyle = `rgba(255, 128, 0, ${beamIntensity})`;
        context.beginPath();
        for (const beam of this.beams()) {
            context.moveTo(beam.x, beam.y + offsetY);
            context.lineTo(beam.x + beam.w, beam.y + beam.h + offsetY);
        }
        context.stroke();
    }
    renderWalkers(context, offsetY, frame) {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        for (const walker of this.walkers) {
            const offsetX = (Math.floor(frame / 3) + walker.frameOffset) % Walker.Frames;
            const spriteSheet = walker.walkDirection === 1 ? Images.WalkerRight : Images.WalkerLeft;
            context.drawImage(spriteSheet, offsetX * Walker.Width, 0, Walker.Width, Walker.Height, walker.x, walker.y + offsetY, Walker.Width, Walker.Height);
        }
    }
    renderCreepers(context, offsetY, frame) {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        for (const creeper of this.creepers) {
            const offsetX = (Math.floor(frame / 3) + creeper.frameOffset) % Creeper.Frames;
            const spriteSheet = creeper.walkDirection === 1 ? Images.CreeperRight : Images.CreeperLeft;
            context.drawImage(spriteSheet, offsetX * Creeper.Width, 0, Creeper.Width, Creeper.Height, creeper.x, creeper.y + offsetY, Creeper.Width, Creeper.Height);
        }
    }
    renderAltars(context, offsetY, frame) {
        const rng = new RNG();
        const height = Block.Height / 2;
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        for (const block of this.blocks) {
            if (!block.altar && !block.warp)
                continue;
            for (let i = 0; i < 30; i++) {
                const rand = rng.nextInt();
                const h = Math.floor(height * rng.nextFloat() * 1.5);
                const x = block.x + 1 + rand % (Block.Width - 2);
                const position = (rng.nextInt() + Math.floor(frame / 2)) % h / h;
                const scaledPosition = position * position;
                const y = block.y - 1 - scaledPosition * h + offsetY;
                if (block.warp) {
                    context.fillStyle = Color.colorWithAlpha(block.color, 1.0 - scaledPosition);
                }
                else {
                    context.fillStyle = `rgba(255, 255, 255, ${1.0 - scaledPosition})`;
                }
                context.fillRect(x, y, 1, 1);
            }
        }
    }
    renderBlocks(context, offsetY) {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        for (const block of this.blocks) {
            if (block.invisible)
                continue;
            switch (block.type) {
                case Block.Aurox: {
                    context.drawImage(Images.Aurox, block.x, block.y + offsetY);
                    break;
                }
                case Block.Beam: {
                    context.drawImage(Images.Beams, block.direction * Block.Width, 0, Block.Width, Block.Height, block.x, block.y + offsetY, Block.Width, Block.Height);
                    break;
                }
                default: {
                    context.drawImage(Images.BlockTilesetMap[block.type], Images.OffsetMap[block.hardConnections] * Block.Width, 0, Block.Width, Block.Height, block.x, block.y + offsetY, Block.Width, Block.Height);
                    break;
                }
            }
            if (block.softConnections === 0)
                continue;
            context.drawImage(Images.StrappingTileset, Images.OffsetMap[block.softConnections] * Block.Width, 0, Block.Width, Block.Height, block.x, block.y + offsetY, Block.Width, Block.Height);
        }
    }
    renderSelection(context, offsetY) {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        for (const index of this.hoverGroup) {
            const block = this.blocks[index];
            context.drawImage(Images.SelectionTileset, Images.OffsetMap[block.hardConnections] * Block.Width, 0, Block.Width, Block.Height, block.x, block.y + offsetY, Block.Width, Block.Height);
        }
    }
    renderInfo(context, offsetY) {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        context.fillStyle = 'white';
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            const x = block.x;
            const y = block.y;
            const group = this.groupIndex[i];
            context.fillText(group + '', x + 7, y + offsetY + 11);
            context.fillText(i + '', x + 2, y + offsetY + 25);
        }
    }
    renderSplatters(context, offsetY) {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        context.fillStyle = Level.SplatterRGB;
        for (const block of this.blocks) {
            for (const splatter of block.splatters) {
                const x = block.x + Math.floor(splatter.x);
                const y = block.y + Math.floor(splatter.y);
                context.fillRect(x, y + offsetY, 1, 1);
            }
        }
        for (const splatter of this.splatters) {
            const x = Math.floor(splatter.x);
            const y = Math.floor(splatter.y);
            context.fillRect(x, y + offsetY, 1, 1);
        }
    }
    renderDebris(context, offsetY) {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        for (const debris of this.debris) {
            const x = Math.floor(debris.x);
            const y = Math.floor(debris.y);
            const opacity = 1.0 / debris.frame;
            context.fillStyle = `${Level.DebrisRGBPrefix} ${opacity})`;
            context.fillRect(x, y + offsetY, 1, 1);
        }
    }
    renderDroplets(context, offsetY, frame) {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        context.fillStyle = '#248';
        const rng = new RNG(frame);
        for (const droplet of this.droplets) {
            const x = Math.floor(droplet.x);
            const y = Math.floor(droplet.y);
            context.fillRect(x, y + offsetY, 1, 1);
        }
        context.fillStyle = '#2488';
        for (const splash of this.splashes) {
            const x = Math.floor(splash.x);
            const y = Math.floor(splash.y);
            context.fillRect(x, y + offsetY, 1, 1);
        }
        context.fillStyle = '#fff4';
        for (const droplet of this.droplets) {
            if (rng.nextFloat() > 0.1)
                continue;
            const x = Math.floor(droplet.x);
            const y = Math.floor(droplet.y);
            context.fillRect(x, y + offsetY, 1, 1);
        }
        context.fillStyle = '#fff2';
        for (const splash of this.splashes) {
            if (rng.nextFloat() > 0.1)
                continue;
            const x = Math.floor(splash.x);
            const y = Math.floor(splash.y);
            context.fillRect(x, y + offsetY, 1, 1);
        }
    }
    render(canvas, offsetY, frame) {
        const context = canvas.getContext('2d');
        this.renderBricks(context, offsetY);
        this.renderBeams(context, offsetY, frame);
        this.renderWalkers(context, offsetY, frame);
        this.renderCreepers(context, offsetY, frame);
        this.renderAltars(context, offsetY, frame);
        this.renderBlocks(context, offsetY);
        // this.renderInfo(context, offsetY)
        this.renderSplatters(context, offsetY);
        this.renderDebris(context, offsetY);
        this.renderDroplets(context, offsetY, frame);
        this.renderSelection(context, offsetY);
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        // xor, multiply, overlay, darken, soft-light, hue, color
    }
    // renderText(canvas: HTMLCanvasElement, offsetY: number) {
    //     const context = canvas.getContext('2d')!
    //     if (this.message !== '') {
    //         const renderedText = TextRenderer.paragraphCanvas(this.message, Images.Font, 360)
    //         const w = renderedText.width
    //         const h = renderedText.height
    //         const x = Math.floor((Level.GridWidth - w) / 2)
    //         const y = Math.floor((Level.GridHeight - h) / 2)
    //         context.drawImage(renderedText, x, y + offsetY)
    //     }
    // }
    renderLight(lightCanvas, offsetY, frame) {
        const lightContext = lightCanvas.getContext('2d');
        lightContext.globalCompositeOperation = 'destination-out';
        const rng = new RNG(frame);
        for (const torch of this.torches) {
            const radius = 196 + rng.nextFloat() * 3;
            const diameter = radius * 2;
            const cx = torch.x + Block.Width / 2 + rng.nextFloat() * 2 - 1;
            const cy = torch.y + Block.Height / 2 + rng.nextFloat() * 2 - 1 + offsetY;
            const gradient = lightContext.createRadialGradient(cx, cy, 0, cx, cy, radius);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(128, 255, 255, 0)');
            lightContext.fillStyle = gradient;
            lightContext.fillRect(cx - radius, cy - radius, diameter, diameter);
        }
        this.renderTorches(lightContext, offsetY, frame);
    }
}
