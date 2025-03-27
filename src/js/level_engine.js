import Block from './block.js';
import Connection from './connection.js';
import Debris from './debris.js';
import Sounds from './sounds.js';
import Splatter from './splatter.js';
import Walker from './walker.js';
export default class Level {
    // Kill the bads, spare the goods
    static WalkerFrames = 8;
    static GridEmpty = 0xffff;
    static GridWidth = 640;
    static GridHeight = 360;
    static GridCenterX = Level.GridWidth / 2;
    static GridCenterY = Level.GridHeight / 2;
    static CellWidth = 20;
    static CellHeight = 30;
    static WalkerWidth = 6;
    static WalkerHeight = 10;
    static CellCountX = Level.GridWidth / Level.CellWidth;
    static CellCountY = Level.GridHeight / Level.CellHeight;
    static ShakeScalar = 0.125;
    static ShakeReduce = 0.9;
    blocks;
    walkers;
    indexGrid;
    fallGrid;
    fallFrame;
    removalIndex;
    splatters;
    debris;
    shake;
    levelData;
    constructor(levelData) {
        this.levelData = levelData;
        this.blocks = [];
        this.walkers = [];
        this.splatters = [];
        this.debris = [];
        this.indexGrid = new Uint16Array(Level.GridWidth * Level.GridWidth).fill(Level.GridEmpty);
        this.fallGrid = new Uint16Array(Level.GridWidth * Level.GridWidth);
        this.fallFrame = 1;
        this.removalIndex = -1;
        this.shake = 0;
        this.load();
    }
    setIndex(grid, x, y, index) {
        grid[y * Level.GridWidth + x] = index;
    }
    setIndices(grid, x, y, w, h, index) {
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                grid[j * Level.GridWidth + i] = index;
            }
        }
    }
    getIndex(grid, x, y) {
        return grid[y * Level.GridWidth + x];
    }
    load() {
        const charGrid = this.levelData.grid;
        const rowCount = charGrid.length;
        const colCount = charGrid[0].length;
        const newCharGrid = Array.from({ length: this.levelData.grid[0].length }, () => '');
        for (let i = 0; i < colCount; i++) {
            for (let j = 0; j < rowCount; j++) {
                newCharGrid[i] += charGrid[j][i];
            }
        }
        const blockGrid = Array.from({ length: Level.CellCountX }, () => new Array(Level.CellCountY).fill(null));
        // Initial block types
        for (let i = 0; i < Level.CellCountX; i++) {
            const cellX = i * 2;
            for (let j = 0; j < Level.CellCountY; j++) {
                const cellY = j * 2;
                const type = Block.CharToType[newCharGrid[cellX][cellY]];
                if (type === Block.None)
                    continue;
                const x = i * Level.CellWidth;
                const y = j * Level.CellHeight;
                blockGrid[i][j] = new Block(x, y, type);
            }
        }
        // Horizontal connections
        for (let i = 0; i < Level.CellCountX - 1; i++) {
            const cellX = i * 2 + 1;
            for (let j = 0; j < Level.CellCountY; j++) {
                const cellY = j * 2;
                const type = Connection.CharToConnection[newCharGrid[cellX][cellY]];
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
                const type = Connection.CharToConnection[newCharGrid[cellX][cellY]];
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
                const type = Connection.CharToConnection[newCharGrid[cellX][cellY]];
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
        // Y-order of insertion is deliberate for proper movement
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
            this.setIndices(this.indexGrid, block.x, block.y, Level.CellWidth, Level.CellHeight, i);
        }
        // Add walkers
        for (const walkerData of this.levelData.walkerData) {
            this.walkers.push(new Walker(walkerData[0], walkerData[1], walkerData[2]));
        }
        this.groundBlocks();
    }
    tap(gridX, gridY) {
        if (this.fallFrame > 0)
            return;
        if (gridX < 0 || gridY < 0 || gridX >= Level.GridWidth || gridY >= Level.GridHeight)
            return;
        const index = this.getIndex(this.indexGrid, gridX, gridY);
        if (index === Level.GridEmpty)
            return;
        const block = this.blocks[index];
        if (!Block.TypeIsDestructible[block.type])
            return;
        this.removalIndex = index;
    }
    // // If fall frame === -1, allow for tap
    // // If there is a successful removal, set fall frame to 0 (from -1)
    // // 
    groundedCount() {
        let groundedCount = 0;
        for (const block of this.blocks) {
            if (block.grounded) {
                groundedCount++;
            }
        }
        return groundedCount;
    }
    update(frame) {
        if (this.removalIndex !== -1) {
            this.remove(this.removalIndex);
            this.removalIndex = -1;
            this.fallFrame = 1;
            Sounds.playBoom();
        }
        if (this.fallFrame > 0) {
            this.groundBlocks();
            const startGroundedCount = this.groundedCount();
            const shakeIntensity = this.fallFrame * 0.25;
            const aliveCount = this.walkers.length;
            for (let i = 0; i < this.fallFrame; i++) {
                this.groundWalkers();
                this.measureWalkerFalls();
                this.killFallingWalkers();
                this.crushWalkers();
                if (this.blocksGrounded() && this.walkersGrounded()) {
                    this.fallFrame = 0;
                    break;
                }
                this.fall();
                this.killFallingWalkers();
                this.groundBlocks();
            }
            const endGroundedCount = this.groundedCount();
            const landedCount = endGroundedCount - startGroundedCount;
            this.shake += shakeIntensity * landedCount * Level.ShakeScalar;
            const deathCount = aliveCount - this.walkers.length;
            for (let i = 0; i < deathCount; i++) {
                Sounds.playSplat();
            }
            if (landedCount > 0) {
                Sounds.playThump();
            }
        }
        this.shake *= Level.ShakeReduce;
        if (this.fallFrame > 0) {
            this.fallFrame++;
        }
        if (frame % 2 === 0) {
            this.walk();
        }
        this.updateSplatters();
        this.updateDebris();
    }
    walk() {
        let initialWalkerCount = this.walkers.length;
        for (const walker of this.walkers) {
            if (!walker.grounded)
                continue;
            // If walker is on edge, set direction
            const floorY = walker.y + Level.WalkerHeight;
            const eastFloorX = walker.x + Level.WalkerWidth - 1;
            const westFloorX = walker.x;
            const eastFloorIndex = this.getIndex(this.indexGrid, eastFloorX, floorY);
            const westFloorIndex = this.getIndex(this.indexGrid, westFloorX, floorY);
            if (eastFloorIndex === Level.GridEmpty) {
                walker.direction = -1;
            }
            else if (westFloorIndex === Level.GridEmpty) {
                walker.direction = 1;
            }
            const footY = floorY - 1;
            if (walker.direction === 1) {
                const eastFootX = eastFloorX + 1;
                const eastFootIndex = this.getIndex(this.indexGrid, eastFootX, footY);
                if (eastFootIndex !== Level.GridEmpty) {
                    const eastFootBlock = this.blocks[eastFootIndex];
                    if (eastFootBlock.type === Block.Goal) {
                        walker.saved = true;
                        continue;
                    }
                    walker.direction = -1;
                }
            }
            else {
                const westFootX = westFloorX - 1;
                const westFootIndex = this.getIndex(this.indexGrid, westFootX, footY);
                if (westFootIndex !== Level.GridEmpty) {
                    walker.direction = 1;
                    const eastFootBlock = this.blocks[westFootIndex];
                    if (eastFootBlock.type === Block.Goal) {
                        walker.saved = true;
                        continue;
                    }
                }
            }
            walker.x += walker.direction;
        }
        this.walkers = this.walkers.filter(walker => !walker.saved);
        if (initialWalkerCount > this.walkers.length) {
            Sounds.playVanish();
        }
    }
    walkerCrushed(walker) {
        if (!walker.grounded)
            return false;
        if (this.getIndex(this.indexGrid, walker.x + Level.WalkerWidth - 1, walker.y) !== Level.GridEmpty)
            return true;
        if (this.getIndex(this.indexGrid, walker.x, walker.y) !== Level.GridEmpty)
            return true;
        return false;
    }
    walkerKilledByFall(walker) {
        return walker.fallStop - walker.fallStart > 30;
    }
    crushWalkers() {
        const alive = [];
        for (const walker of this.walkers) {
            if (this.walkerCrushed(walker)) {
                this.splatter(walker, 3);
            }
            else {
                alive.push(walker);
            }
        }
        this.walkers = alive;
    }
    killFallingWalkers() {
        const alive = [];
        for (const walker of this.walkers) {
            if (this.walkerKilledByFall(walker)) {
                this.splatter(walker, 1);
            }
            else {
                alive.push(walker);
            }
        }
        this.walkers = alive;
    }
    splatter(walker, vyScalar) {
        const count = Splatter.CountMinimum + Math.floor(Splatter.CountMaximum - Splatter.CountMinimum);
        const x = walker.x + Level.WalkerWidth / 2;
        const y = walker.y + Level.WalkerHeight;
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
            const index = this.getIndex(this.indexGrid, x, y);
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
            this.setIndices(this.indexGrid, lastBlock.x, lastBlock.y, Level.CellWidth, Level.CellHeight, index);
        }
        this.blocks.length--;
        this.setIndices(this.indexGrid, block.x, block.y, Level.CellWidth, Level.CellHeight, Level.GridEmpty);
        // Remove direct soft connections
        for (let i = 0; i < Connection.DirectionCount; i++) {
            if ((block.softConnections & Connection.DirectionBits[i]) === 0)
                continue;
            const softConnectionVector = Connection.DirectionVectors[i];
            const softConnectionX = x + Level.CellWidth * softConnectionVector.dx;
            const softConnectionY = y + Level.CellHeight * softConnectionVector.dy;
            const softConnectionIndex = this.getIndex(this.indexGrid, softConnectionX, softConnectionY);
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
            const xA = x + vectorA.dx * Level.CellWidth;
            const xB = x + vectorB.dx * Level.CellWidth;
            const yA = y + vectorA.dy * Level.CellHeight;
            const yB = y + vectorB.dy * Level.CellHeight;
            const indexA = this.getIndex(this.indexGrid, xA, yA);
            const indexB = this.getIndex(this.indexGrid, xB, yB);
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
            const hardConnectionX = x + Level.CellWidth * hardConnectionVector.dx;
            const hardConnectionY = y + Level.CellHeight * hardConnectionVector.dy;
            const hardConnectionIndex = this.getIndex(this.indexGrid, hardConnectionX, hardConnectionY);
            this.remove(hardConnectionIndex);
        }
        const debrisCount = Math.floor(Debris.CountMinimum + Math.random() * (Debris.CountMaximum - Debris.CountMinimum));
        for (let i = 0; i < debrisCount; i++) {
            this.debris.push(new Debris(block));
        }
    }
    fall() {
        this.fallGrid.fill(Level.GridEmpty);
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            if (block.grounded)
                continue;
            this.setIndices(this.indexGrid, block.x, block.y, Level.CellWidth, Level.CellHeight, Level.GridEmpty);
            block.y++;
            this.setIndices(this.fallGrid, block.x, block.y, Level.CellWidth, Level.CellHeight, i);
        }
        for (let i = 0; i < this.fallGrid.length; i++) {
            const index = this.fallGrid[i];
            if (index === Level.GridEmpty)
                continue;
            this.indexGrid[i] = index;
        }
        for (const walker of this.walkers) {
            if (!walker.grounded) {
                walker.y++;
            }
        }
    }
    walkersGrounded() {
        for (const walker of this.walkers) {
            if (!walker.grounded)
                return false;
        }
        return true;
    }
    groundWalkers() {
        for (const walker of this.walkers) {
            const y = walker.y + Level.WalkerHeight;
            const xEast = walker.x + Level.WalkerWidth - 1;
            const indexEast = this.getIndex(this.indexGrid, xEast, y);
            if (indexEast !== Level.GridEmpty && this.blocks[indexEast].grounded) {
                walker.grounded = true;
                continue;
            }
            const xWest = walker.x;
            const indexWest = this.getIndex(this.indexGrid, xWest, y);
            if (indexWest !== Level.GridEmpty && this.blocks[indexWest].grounded) {
                walker.grounded = true;
                continue;
            }
            walker.grounded = false;
        }
    }
    measureWalkerFalls() {
        for (const walker of this.walkers) {
            if (walker.falling) {
                if (walker.grounded) {
                    walker.falling = false;
                    walker.fallStop = walker.y;
                }
            }
            else {
                if (!walker.grounded) {
                    walker.falling = true;
                    walker.fallStart = walker.y;
                }
            }
        }
    }
    blocksGrounded() {
        for (const block of this.blocks) {
            if (!block.grounded)
                return false;
        }
        return true;
    }
    groundBlocks() {
        for (const block of this.blocks) {
            block.grounded = false;
        }
        for (const block of this.blocks) {
            if (Block.TypeFalls[block.type])
                continue;
            this.groundBlock(block);
        }
    }
    groundBlock(block) {
        if (block.grounded)
            return;
        block.grounded = true;
        // Ground block above
        if (block.y > 0) {
            const index = this.getIndex(this.indexGrid, block.x, block.y - 1);
            if (index !== Level.GridEmpty) {
                this.groundBlock(this.blocks[index]);
            }
        }
        // Ground connected blocks
        for (let i = 0; i < Connection.DirectionCount; i++) {
            const directionBit = Connection.DirectionBits[i];
            const hardConnection = (block.hardConnections & directionBit) === directionBit;
            const softConnection = (block.softConnections & directionBit) === directionBit;
            if (!hardConnection && !softConnection)
                continue;
            const connectionVector = Connection.DirectionVectors[i];
            const connectionX = block.x + connectionVector.dx * Level.CellWidth;
            const connectionY = block.y + connectionVector.dy * Level.CellHeight;
            const connectionIndex = this.getIndex(this.indexGrid, connectionX, connectionY);
            const connectionBlock = this.blocks[connectionIndex];
            this.groundBlock(connectionBlock);
        }
    }
}
