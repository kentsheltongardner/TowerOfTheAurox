import Level from './level.js';
import Rect from './rect.js';
import Point from './point.js';
import Images from './images.js';
import Camera from './camera.js';
import Sounds from './sounds.js';
import TextRenderer from './text.js';
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
    canvas = document.createElement('canvas');
    uiCanvas = document.createElement('canvas');
    lightCanvas = document.createElement('canvas');
    displayCanvas;
    displayContext;
    levelIndex;
    levelCount;
    levelPrev;
    levelCurr;
    levelNext;
    levelNextNext;
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
    mousePosition;
    mousePressed;
    mousePresent;
    // Numeric scroll system based on direction of movement (up or down)
    constructor(levelData, displayCanvas) {
        this.camera = new Camera();
        this.levelData = levelData;
        this.levelIndex = 1;
        this.levelCount = this.levelData.length;
        this.levelPrev = new Level(this.levelData[this.levelIndex - 1], this.camera);
        this.levelCurr = new Level(this.levelData[this.levelIndex], this.camera);
        this.levelNext = new Level(this.levelData[this.levelIndex + 1], this.camera);
        this.levelNextNext = new Level(this.levelData[this.levelIndex + 2], this.camera);
        this.canvas.width = Level.GridWidth;
        this.uiCanvas.width = Level.GridWidth;
        this.lightCanvas.width = Level.GridWidth;
        this.canvas.height = Level.GridHeight * 4;
        this.uiCanvas.height = Level.GridHeight;
        this.lightCanvas.height = Level.GridHeight * 4;
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
        this.mousePosition = new Point(0, 0);
        this.mousePressed = false;
        this.mousePresent = false;
        this.resize();
        window.addEventListener('resize', () => { this.resize(); });
        this.displayCanvas.addEventListener('mousedown', e => { this.tap(e.offsetX, e.offsetY); });
        this.displayCanvas.addEventListener('mouseup', () => { this.mousePressed = false; });
        this.displayCanvas.addEventListener('mouseenter', () => { this.mousePresent = true; });
        this.displayCanvas.addEventListener('mouseleave', () => { this.mousePresent = false; });
        this.displayCanvas.addEventListener('mousemove', e => { this.mouseMove(e.offsetX, e.offsetY); });
        window.addEventListener('keydown', e => { this.keyDown(e); });
        window.addEventListener('keyup', e => { this.keyUp(e); });
        window.addEventListener('contextmenu', e => e.preventDefault());
        requestAnimationFrame(timestamp => this.loop(timestamp));
    }
    mouseMove(x, y) {
        this.mousePresent = true;
        const gamePoint = this.gamePoint(x, y);
        this.mousePosition = this.displayPoint(gamePoint.x, gamePoint.y);
        this.levelCurr.hover(gamePoint.x, gamePoint.y);
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
                this.levelNextNext = new Level(this.levelData[this.levelIndex + 2], this.camera);
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
                this.levelNextNext = new Level(this.levelData[this.levelIndex + 2], this.camera);
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
        this.mousePressed = true;
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
            const music = document.getElementById('music');
            music.volume = 0.5;
            music.loop = true;
            music.play();
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
                    this.levelNextNext = new Level(this.levelData[this.levelIndex + 2], this.camera);
                    this.scrollFrame = 0;
                }
            }
            else {
                if (this.tapped) {
                    this.levelCurr.tap(this.tapPoint.x, this.tapPoint.y);
                    this.tapped = false;
                }
                if (this.levelCurr.message === '') {
                    if (this.skip) {
                        for (let i = 0; i < Game.FrameSkipCount; i++) {
                            this.update();
                            this.camera.update();
                        }
                    }
                    else {
                        this.update();
                        this.camera.update();
                    }
                }
            }
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
    displayPoint(gameX, gameY) {
        const scalar = this.displayScalar();
        const rect = this.displayRect();
        const x = rect.x + gameX * scalar;
        const y = rect.y + gameY * scalar;
        return new Point(x, y);
    }
    resize() {
        this.displayCanvas.width = window.innerWidth;
        this.displayCanvas.height = window.innerHeight;
    }
    render(frame) {
        const context = this.canvas.getContext('2d');
        const lightContext = this.lightCanvas.getContext('2d');
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        lightContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const shakeIntensity = this.camera.shakeIntensity;
        const shakeY = Math.round((Math.random() * shakeIntensity * 2 - shakeIntensity) * 10);
        const scrollY = Math.round(this.smooth(this.scrollFrame / Game.ScrollFrames) * Level.GridHeight);
        const offsetY = shakeY + scrollY;
        this.levelNextNext.render(this.canvas, offsetY, 0);
        this.levelNext.render(this.canvas, Level.GridHeight + offsetY, 0);
        this.levelCurr.render(this.canvas, Level.GridHeight * 2 + offsetY, frame);
        this.levelPrev.render(this.canvas, Level.GridHeight * 3 + offsetY, 0);
        lightContext.globalCompositeOperation = 'source-over';
        lightContext.fillStyle = '#000000fd';
        lightContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.levelNextNext.renderLight(this.lightCanvas, offsetY, frame);
        this.levelNext.renderLight(this.lightCanvas, Level.GridHeight + offsetY, frame);
        this.levelCurr.renderLight(this.lightCanvas, Level.GridHeight * 2 + offsetY, frame);
        this.levelPrev.renderLight(this.lightCanvas, Level.GridHeight * 3 + offsetY, frame);
        context.globalCompositeOperation = 'source-over';
        context.drawImage(this.lightCanvas, 0, 0);
        context.globalCompositeOperation = 'soft-light';
        context.fillStyle = 'rgba(255, 128, 64, 0.6)';
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        context.globalCompositeOperation = 'source-over';
        this.renderText(context, offsetY);
        const displayRect = this.displayRect();
        const screenY = Level.GridHeight * 2;
        this.displayContext.imageSmoothingEnabled = false;
        this.displayContext.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
        this.displayContext.drawImage(this.canvas, 0, screenY, Level.GridWidth, Level.GridHeight, displayRect.x, displayRect.y, displayRect.w, displayRect.h);
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
        this.renderMouse();
    }
    renderMouse() {
        if (this.mousePresent) {
            const displayScalar = this.displayScalar();
            const image = this.mousePressed ? Images.CursorClosed : Images.Cursor;
            this.displayContext.drawImage(image, Math.floor(this.mousePosition.x), Math.floor(this.mousePosition.y), Images.Cursor.width * displayScalar, Images.Cursor.height * displayScalar);
        }
    }
    renderText(context, offsetY) {
        const message = this.levelCurr.message;
        if (message === '')
            return;
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        const renderedText = TextRenderer.paragraphCanvas(message, Images.Font, 360);
        const w = renderedText.width;
        const h = renderedText.height;
        const x = Math.floor((Level.GridWidth - w) / 2);
        const y = Math.floor((Level.GridHeight - h) / 2) + Level.GridHeight * 2 + offsetY;
        context.drawImage(renderedText, x, y);
    }
    // Render 
    smooth(x) {
        const sin = Math.sin(Math.PI * x / 2);
        return sin * sin;
    }
}
