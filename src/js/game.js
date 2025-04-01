import Level from './level.js';
import Rect from './rect.js';
import Point from './point.js';
import Images from './images.js';
import Camera from './camera.js';
import Sounds from './sounds.js';
import Block from './block.js';
import RNG from './rng.js';
import Walker from './walker.js';
import Creeper from './creeper.js';
import Color from './color.js';
export default class Game {
    static AmbientGradientRadius = Math.hypot(Level.GridCenterX, Level.GridCenterY);
    static SplatterRGB = '#9f040460';
    static DebrisRGBPrefix = 'rgba(115, 65, 32, ';
    static TargetFPS = 60;
    static FrameTimeMilliseconds = 1000 / Game.TargetFPS;
    static ScrollTimeMilliseconds = 1000;
    static ScrollFrames = Math.floor(Game.ScrollTimeMilliseconds / Game.FrameTimeMilliseconds);
    static FrameSkipCount = 8;
    static TitleFadeoutMilliseconds = 500;
    static TitleFadeoutFrames = Math.floor(Game.TitleFadeoutMilliseconds / Game.FrameTimeMilliseconds);
    canvasPrev;
    canvasCurr;
    canvasNext;
    canvasAll;
    displayCanvas;
    displayContext;
    levelIndex;
    levelCount;
    levelPrev;
    levelCurr;
    levelNext;
    levelData;
    musicPlaying;
    lastTimestamp;
    frame;
    titleFadeOutFrame;
    scrollFrame;
    tapPoint;
    tapped;
    camera;
    overlayOpacity;
    skip;
    // Numeric scroll system based on direction of movement (up or down)
    constructor(levelData, displayCanvas) {
        this.camera = new Camera();
        this.levelData = levelData;
        this.levelIndex = 1;
        this.levelCount = this.levelData.length;
        this.levelPrev = new Level(this.levelData[this.levelIndex - 1], this.camera);
        this.levelCurr = new Level(this.levelData[this.levelIndex], this.camera);
        this.levelNext = new Level(this.levelData[this.levelIndex + 1], this.camera);
        this.canvasPrev = document.createElement('canvas');
        this.canvasCurr = document.createElement('canvas');
        this.canvasNext = document.createElement('canvas');
        this.canvasAll = document.createElement('canvas');
        this.canvasPrev.width = Level.GridWidth;
        this.canvasCurr.width = Level.GridWidth;
        this.canvasNext.width = Level.GridWidth;
        this.canvasAll.width = Level.GridWidth;
        this.canvasPrev.height = Level.GridHeight;
        this.canvasCurr.height = Level.GridHeight;
        this.canvasNext.height = Level.GridHeight;
        this.canvasAll.height = Level.GridHeight * 3;
        this.displayCanvas = displayCanvas;
        this.displayContext = this.displayCanvas.getContext('2d');
        this.musicPlaying = false;
        this.lastTimestamp = 0;
        this.frame = 0;
        this.scrollFrame = 0;
        this.titleFadeOutFrame = 0;
        this.tapPoint = new Point(0, 0);
        this.tapped = false;
        this.overlayOpacity = 0;
        this.skip = false;
        this.resize();
        window.addEventListener('resize', () => { this.resize(); });
        window.addEventListener('mousedown', e => { this.tap(e.offsetX, e.offsetY); });
        window.addEventListener('touchstart', e => {
            const touch = e.touches[0];
            this.tap(touch.clientX, touch.clientY);
        });
        window.addEventListener('keydown', e => { this.keyDown(e); });
        window.addEventListener('keyup', e => { this.keyUp(e); });
        window.addEventListener('contextmenu', e => e.preventDefault());
        requestAnimationFrame(timestamp => this.loop(timestamp));
    }
    keyDown(e) {
        switch (e.code) {
            case 'KeyR': {
                this.levelCurr = new Level(this.levelData[this.levelIndex], this.camera);
                this.scrollFrame = 0;
                this.overlayOpacity = 0;
                break;
            }
            case 'KeyN': {
                if (this.levelIndex >= this.levelCount - 2)
                    break;
                this.levelIndex++;
                this.levelPrev = new Level(this.levelData[this.levelIndex - 1], this.camera);
                this.levelCurr = new Level(this.levelData[this.levelIndex], this.camera);
                this.levelNext = new Level(this.levelData[this.levelIndex + 1], this.camera);
                this.scrollFrame = 0;
                this.overlayOpacity = 0;
                break;
            }
            case 'KeyP': {
                if (this.levelIndex <= 1)
                    break;
                this.levelIndex--;
                this.levelPrev = new Level(this.levelData[this.levelIndex - 1], this.camera);
                this.levelCurr = new Level(this.levelData[this.levelIndex], this.camera);
                this.levelNext = new Level(this.levelData[this.levelIndex + 1], this.camera);
                this.scrollFrame = 0;
                this.overlayOpacity = 0;
                break;
            }
            case 'KeyF': {
                this.skip = true;
                break;
            }
        }
    }
    keyUp(e) {
        switch (e.code) {
            case 'KeyF': {
                this.skip = false;
                break;
            }
        }
    }
    tap(x, y) {
        if (this.titleFadeOutFrame === 0) {
            this.titleFadeOutFrame = 1;
            return;
        }
        if (this.titleFadeOutFrame < Game.TitleFadeoutFrames) {
            return;
        }
        this.tapped = true;
        this.tapPoint = this.gamePoint(x, y);
        console.log(this.tapPoint.x, this.tapPoint.y);
        if (!this.musicPlaying) {
            this.musicPlaying = true;
            const audio = new Audio('./res/music/ambience.mp3');
            audio.volume = 0.5;
            audio.loop = true;
            audio.play();
        }
    }
    update() {
        if (this.titleFadeOutFrame > 0
            && this.titleFadeOutFrame < Game.TitleFadeoutFrames) {
            this.titleFadeOutFrame++;
        }
        if (this.frame % 1 === 0) {
            this.levelCurr.update(this.frame);
        }
        if (this.levelCurr.complete() && this.levelIndex < this.levelCount - 2) {
            Sounds.playBell();
            this.scrollFrame = 1;
        }
        this.frame++;
    }
    loop(timestamp) {
        if (timestamp - this.lastTimestamp >= Game.FrameTimeMilliseconds) {
            this.lastTimestamp = timestamp;
            if (this.scrollFrame > 0) {
                this.scrollFrame++;
                if (this.scrollFrame === Game.ScrollFrames) {
                    this.levelIndex++;
                    this.levelPrev = this.levelCurr;
                    this.levelCurr = new Level(this.levelData[this.levelIndex], this.camera);
                    this.levelNext = new Level(this.levelData[this.levelIndex + 1], this.camera);
                    this.scrollFrame = 0;
                }
            }
            else {
                if (this.tapped) {
                    this.levelCurr.tap(this.tapPoint.x, this.tapPoint.y);
                    this.tapped = false;
                }
                if (this.skip) {
                    for (let i = 0; i < Game.FrameSkipCount; i++) {
                        this.update();
                    }
                }
                else {
                    this.update();
                }
            }
            this.camera.update();
            this.render(this.frame);
        }
        requestAnimationFrame(timestamp => this.loop(timestamp));
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
    renderLevel(level, canvas, frame) {
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        const rng = new RNG();
        context.fillStyle = '#0002';
        for (let i = 0; i < Level.GridWidth; i += Level.BrickWidth) {
            for (let j = 0; j < Level.GridHeight; j += Level.BrickHeight * 2) {
                context.drawImage(Images.Brick, i, j);
                if (rng.nextInt() % 3 === 0) {
                    context.fillRect(i, j, Level.BrickWidth, Level.BrickHeight);
                }
            }
        }
        for (let i = -Level.BrickWidth / 2; i < Level.GridWidth; i += Level.BrickWidth) {
            for (let j = Level.BrickHeight; j < Level.GridHeight; j += Level.BrickHeight * 2) {
                context.drawImage(Images.Brick, i, j);
                if (rng.nextInt() % 3 === 0) {
                    context.fillRect(i, j, Level.BrickWidth, Level.BrickHeight);
                }
            }
        }
        for (const torch of level.torches) {
            const offsetX = Math.floor((frame + torch.frame) / 2) % 5 * Block.Width;
            context.drawImage(Images.Torch, offsetX, 0, Block.Width, Block.Height, torch.x, torch.y, Block.Width, Block.Height);
        }
        for (const torch of level.torches) {
            const radius = 28 + Math.random() * 3;
            const diameter = radius * 2;
            const cx = torch.x + Block.Width / 2 + Math.random() * 2 - 1;
            const cy = torch.y + Block.Height / 2 + Math.random() * 2 - 1;
            const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.25');
            gradient.addColorStop(0.5, 'rgba(255, 128, 0, 0.125');
            gradient.addColorStop(0.75, 'rgba(255, 0, 0, 0.0625');
            gradient.addColorStop(1, 'rgba(128, 0, 0, 0');
            context.fillStyle = gradient;
            context.fillRect(cx - radius, cy - radius, diameter, diameter);
        }
        const beamIntensity = 0.5 + 0.5 * this.smooth(this.frame * 0.075);
        context.strokeStyle = `rgba(255, 128, 0, ${beamIntensity})`;
        context.beginPath();
        for (const beam of level.beams()) {
            context.moveTo(beam.x, beam.y);
            context.lineTo(beam.x + beam.w, beam.y + beam.h);
        }
        context.stroke();
        for (const walker of level.walkers) {
            const offsetX = (Math.floor(frame / 3) + walker.frameOffset) % Walker.Frames;
            const spriteSheet = walker.walkDirection === 1 ? Images.WalkerRight : Images.WalkerLeft;
            context.drawImage(spriteSheet, offsetX * Walker.Width, 0, Walker.Width, Walker.Height, walker.x, walker.y, Walker.Width, Walker.Height);
        }
        for (const creeper of level.creepers) {
            const offsetX = (Math.floor(frame / 3) + creeper.frameOffset) % Creeper.Frames;
            const spriteSheet = creeper.walkDirection === 1 ? Images.CreeperRight : Images.CreeperLeft;
            context.drawImage(spriteSheet, offsetX * Creeper.Width, 0, Creeper.Width, Creeper.Height, creeper.x, creeper.y, Creeper.Width, Creeper.Height);
        }
        const altarIntensity = 0.25 + 0.25 * this.smooth(this.frame * 0.05);
        for (const block of level.blocks) {
            if (!block.altar && !block.warp)
                continue;
            const height = Block.Height * 0.25;
            const gradient = context.createLinearGradient(block.x, block.y - height, block.x, block.y - 1);
            if (block.altar) {
                gradient.addColorStop(0, Color.cssColor(255, 255, 255, 0));
                gradient.addColorStop(1, Color.cssColor(255, 255, 255, altarIntensity));
            }
            else {
                gradient.addColorStop(0, Color.colorWithAlpha(block.color, 0));
                gradient.addColorStop(1, Color.colorWithAlpha(block.color, altarIntensity));
            }
            context.fillStyle = gradient;
            context.fillRect(block.x, block.y - height, Block.Width, height);
        }
        for (const block of level.blocks) {
            if (block.invisible)
                continue;
            switch (block.type) {
                case Block.Beam: {
                    context.drawImage(Images.Beams, block.direction * Block.Width, 0, Block.Width, Block.Height, block.x, block.y, Block.Width, Block.Height);
                    break;
                }
                default: {
                    context.drawImage(Images.BlockTilesetMap[block.type], Images.OffsetMap[block.hardConnections] * Block.Width, 0, Block.Width, Block.Height, block.x, block.y, Block.Width, Block.Height);
                    break;
                }
            }
            context.globalAlpha = 1.0;
            if (block.softConnections === 0)
                continue;
            context.drawImage(Images.StrappingTileset, Images.OffsetMap[block.softConnections] * Block.Width, 0, Block.Width, Block.Height, block.x, block.y, Block.Width, Block.Height);
        }
        context.fillStyle = 'white';
        for (let i = 0; i < level.blocks.length; i++) {
            const block = level.blocks[i];
            const x = block.x;
            const y = block.y;
            const group = level.groupIndex[i];
            // context.fillText(group + '', x + 7, y + 11)
            // context.fillText(i + '', x + 2, y + 25)
        }
        for (const block of level.blocks) {
            context.fillStyle = Game.SplatterRGB;
            for (const splatter of block.splatters) {
                const x = block.x + Math.floor(splatter.x);
                const y = block.y + Math.floor(splatter.y);
                context.fillRect(x, y, 1, 1);
            }
        }
        // for (let i = 0; i < Level.GridWidth; i++) {
        //     for (let j = 0; j < Level.GridHeight; j++) {
        //         const block = level.getIndex(i, j)
        //         if (block === Level.GridEmpty) continue
        //         const intensity = block * 10 % 200 + 20
        //         context.fillStyle = `rgba(${intensity}, ${intensity}, 0, 0.5)`
        //         context.fillRect(i, j, 1, 1)
        //     }
        // }
        context.fillStyle = Game.SplatterRGB;
        for (const splatter of level.splatters) {
            const x = Math.floor(splatter.x);
            const y = Math.floor(splatter.y);
            context.fillRect(x, y, 1, 1);
        }
        for (const debris of level.debris) {
            const x = Math.floor(debris.x);
            const y = Math.floor(debris.y);
            const opacity = 1.0 / debris.frame;
            context.fillStyle = `${Game.DebrisRGBPrefix} ${opacity})`;
            context.fillRect(x, y, 1, 1);
        }
        // xor, multiply, overlay, darken, soft-light, hue, color
        context.globalCompositeOperation = 'multiply';
        context.fillStyle = 'rgba(255, 128, 64, 0.6)';
        context.fillRect(0, 0, Level.GridWidth, Level.GridHeight);
        context.globalCompositeOperation = 'source-over';
    }
    render(frame) {
        this.renderLevel(this.levelPrev, this.canvasPrev, 0);
        this.renderLevel(this.levelCurr, this.canvasCurr, frame);
        this.renderLevel(this.levelNext, this.canvasNext, 0);
        const contextAll = this.canvasAll.getContext('2d');
        contextAll.clearRect(0, 0, this.canvasAll.width, this.canvasAll.height);
        contextAll.drawImage(this.canvasNext, 0, 0);
        contextAll.drawImage(this.canvasCurr, 0, Level.GridHeight);
        contextAll.drawImage(this.canvasPrev, 0, Level.GridHeight * 2);
        const displayRect = this.displayRect();
        const displayScalar = this.displayScalar();
        const shakeIntensity = this.camera.shakeIntensity;
        const shakeY = Math.round((Math.random() * shakeIntensity * 2 - shakeIntensity) * displayScalar);
        const scrollY = Math.round(this.smooth(this.scrollFrame / Game.ScrollFrames) * Level.GridHeight);
        const offsetY = Level.GridHeight - scrollY + shakeY;
        this.displayContext.imageSmoothingEnabled = false;
        this.displayContext.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
        this.displayContext.drawImage(this.canvasAll, 0, offsetY, Level.GridWidth, Level.GridHeight, displayRect.x, displayRect.y, displayRect.w, displayRect.h);
        this.overlayOpacity = this.levelCurr.deaths > 0 ?
            this.overlayOpacity + (0.25 - this.overlayOpacity) * 0.05 :
            this.overlayOpacity + (0 - this.overlayOpacity) * 0.05;
        this.displayContext.fillStyle = `rgba(255, 0, 0, ${this.overlayOpacity})`;
        this.displayContext.fillRect(displayRect.x, displayRect.y, displayRect.w, displayRect.h);
        if (this.titleFadeOutFrame < Game.TitleFadeoutFrames) {
            this.displayContext.globalAlpha = this.smooth(1.0 - this.titleFadeOutFrame / Game.TitleFadeoutFrames);
            // generate falling stars?
            this.displayContext.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.displayContext.fillRect(displayRect.x, displayRect.y, displayRect.w, displayRect.h);
            this.displayContext.drawImage(Images.Title, displayRect.x, displayRect.y, displayRect.w, displayRect.h);
            this.displayContext.globalAlpha = 1.0;
        }
    }
    smooth(x) {
        const sin = Math.sin(Math.PI * x / 2);
        return sin * sin;
    }
}
