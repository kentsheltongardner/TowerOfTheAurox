import Level from './level.js';
import Images from './images.js';
import Point from './point.js';
import Rect from './rect.js';
export default class Renderer {
    static AmbientGradientRadius = Math.hypot(Level.GridCenterX, Level.GridCenterY);
    static SplatterRGB = '#9f040480';
    // public static readonly SplatterRGB = '#48f8'
    static DebrisRGBPrefix = 'rgba(115, 65, 32, ';
    game;
    canvas;
    displayCanvas;
    context;
    displayContext;
    constructor(game, displayCanvas) {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.game = game;
        this.displayCanvas = displayCanvas;
        this.displayContext = this.displayCanvas.getContext('2d');
        this.canvas.width = Level.GridWidth;
        this.canvas.height = Level.GridHeight;
        this.resize();
        window.addEventListener('resize', () => { this.resize(); });
    }
    horizontalDisplay() {
        return window.innerWidth * Level.GridHeight > window.innerHeight * Level.GridWidth;
    }
    displayScalar() {
        if (this.horizontalDisplay()) {
            return window.innerHeight / Level.GridHeight;
        }
        return window.innerWidth / Level.GridWidth;
    }
    displayRect() {
        const scalar = this.displayScalar();
        const width = Math.floor(Level.GridWidth * scalar);
        const height = Math.floor(Level.GridHeight * scalar);
        const x = Math.floor((window.innerWidth - width) / 2.0);
        const y = Math.floor((window.innerHeight - height) / 2.0);
        return new Rect(x, y, width, height);
    }
    gamePoint(displayX, displayY) {
        const scalar = this.displayScalar();
        const rect = this.displayRect();
        const x = Math.floor((displayX - rect.x) / scalar);
        const y = Math.floor((displayY - rect.y) / scalar);
        return new Point(x, y);
    }
    resize() {
        this.displayCanvas.width = window.innerWidth;
        this.displayCanvas.height = window.innerHeight;
    }
    render(frame) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const block of this.level.blocks) {
            this.context.drawImage(Images.BlockTilesetMap[block.type], Images.OffsetMap[block.hardConnections] * Level.CellWidth, 0, Level.CellWidth, Level.CellHeight, block.x, block.y, Level.CellWidth, Level.CellHeight);
            if (block.softConnections === 0)
                continue;
            this.context.drawImage(Images.StrappingTileset, Images.OffsetMap[block.softConnections] * Level.CellWidth, 0, Level.CellWidth, Level.CellHeight, block.x, block.y, Level.CellWidth, Level.CellHeight);
        }
        for (const block of this.level.blocks) {
            this.context.fillStyle = Renderer.SplatterRGB;
            for (const splatter of block.splatters) {
                const x = block.x + Math.floor(splatter.x);
                const y = block.y + Math.floor(splatter.y);
                this.context.fillRect(x, y, 1, 1);
            }
        }
        this.context.globalCompositeOperation = 'darken';
        for (const walker of this.level.walkers) {
            const centerX = walker.x + Level.WalkerWidth / 2;
            const centerY = walker.y + Level.WalkerHeight / 2;
            const walkerGradient = this.context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15);
            walkerGradient.addColorStop(0, '#fff1');
            walkerGradient.addColorStop(0.25, '#ff02');
            walkerGradient.addColorStop(0.5, '#f801');
            walkerGradient.addColorStop(1, '#f000');
            this.context.fillStyle = walkerGradient;
            this.context.fillRect(centerX - 15, centerY - 15, 30, 30);
        }
        this.context.globalCompositeOperation = 'source-over';
        for (const walker of this.level.walkers) {
            const offsetX = (Math.floor(frame / 3) + walker.frameOffset) % Level.WalkerFrames;
            const spriteSheet = walker.direction === 1 ? Images.WalkerRight : Images.WalkerLeft;
            this.context.drawImage(spriteSheet, offsetX * Level.WalkerWidth, 0, Level.WalkerWidth, Level.WalkerHeight, walker.x, walker.y, Level.WalkerWidth, Level.WalkerHeight);
        }
        this.context.fillStyle = Renderer.SplatterRGB;
        for (const splatter of this.level.splatters) {
            const x = Math.floor(splatter.x);
            const y = Math.floor(splatter.y);
            this.context.fillRect(x, y, 1, 1);
        }
        for (const debris of this.level.debris) {
            const x = Math.floor(debris.x);
            const y = Math.floor(debris.y);
            const opacity = 1.0 / debris.frame;
            this.context.fillStyle = `${Renderer.DebrisRGBPrefix} ${opacity})`;
            this.context.fillRect(x, y, 1, 1);
        }
        const displayRect = this.displayRect();
        const displayScalar = this.displayScalar();
        const shakeY = Math.round((Math.random() * this.level.shake * 2 - this.level.shake) * displayScalar);
        this.displayContext.imageSmoothingEnabled = false;
        this.displayContext.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
        this.displayContext.drawImage(this.canvas, displayRect.x, displayRect.y + shakeY, displayRect.w, displayRect.h);
    }
}
