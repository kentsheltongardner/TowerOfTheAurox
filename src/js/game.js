import Level from './level.js';
import Rect from './rect.js';
import Point from './point.js';
import Images from './images.js';
import Camera from './camera.js';
import Sounds from './sounds.js';
export default class Game {
    static Tau = Math.PI * 2;
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
    // public canvasPrev:          HTMLCanvasElement
    // public canvasCurr:          HTMLCanvasElement
    // public canvasNext:          HTMLCanvasElement
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
        // this.canvasPrev         = document.createElement('canvas')
        // this.canvasCurr         = document.createElement('canvas')
        // this.canvasNext         = document.createElement('canvas')
        this.canvasAll = document.createElement('canvas');
        // this.canvasPrev.width           = Level.GridWidth
        // this.canvasCurr.width           = Level.GridWidth
        // this.canvasNext.width           = Level.GridWidth
        this.canvasAll.width = Level.GridWidth;
        // this.canvasPrev.height          = Level.GridHeight
        // this.canvasCurr.height          = Level.GridHeight
        // this.canvasNext.height          = Level.GridHeight
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
    render(frame) {
        this.levelPrev.render(0);
        this.levelCurr.render(frame);
        this.levelNext.render(0);
        const contextAll = this.canvasAll.getContext('2d');
        contextAll.clearRect(0, 0, this.canvasAll.width, this.canvasAll.height);
        contextAll.drawImage(this.levelNext.canvas, 0, 0);
        contextAll.drawImage(this.levelCurr.canvas, 0, Level.GridHeight);
        contextAll.drawImage(this.levelPrev.canvas, 0, Level.GridHeight * 2);
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
