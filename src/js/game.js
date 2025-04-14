import Level from './level.js';
import Rect from './rect.js';
import Point from './point.js';
import Images from './images.js';
import Camera from './camera.js';
import Sounds from './sounds.js';
import TextRenderer from './text.js';
import Block from './block.js';
import Button from './button.js';
export default class Game {
    static Tau = Math.PI * 2;
    static AmbientGradientRadius = Math.hypot(Level.GridCenterX, Level.GridCenterY);
    static SplatterRGB = '#9f040460';
    static DebrisRGBPrefix = 'rgba(115, 65, 32, ';
    static TargetFPS = 60;
    static FrameTimeMilliseconds = 1000 / Game.TargetFPS;
    static ScrollTimeMilliseconds = 750;
    static ScrollFrames = Math.floor(Game.ScrollTimeMilliseconds / Game.FrameTimeMilliseconds);
    static FrameSkipCount = 8;
    static TitleFadeoutMilliseconds = 500;
    static TitleFadeoutFrames = Math.floor(Game.TitleFadeoutMilliseconds / Game.FrameTimeMilliseconds);
    canvas = document.createElement('canvas');
    uiCanvas = document.createElement('canvas');
    lightCanvas = document.createElement('canvas');
    displayCanvas;
    displayContext;
    levelCount;
    levelPrev;
    levelCurr;
    levelNext;
    levelNextNext;
    levelData;
    levelIndex = 1;
    musicPlaying = false;
    lastTimestamp = 0;
    titleFadeOutFrame = 0;
    scrollFrame = 0;
    tapPoint = new Point(0, 0);
    tapped = false;
    camera = new Camera();
    overlayOpacity = 0;
    speedPressed = false;
    paused = false;
    mousePosition = new Point(0, 0);
    gamePosition = new Point(0, 0);
    mousePressed = false;
    mousePresent = false;
    buttons = [];
    muted = false;
    hoverButton = null;
    // Numeric scroll system based on direction of movement (up or down)
    constructor(levelData, displayCanvas) {
        this.camera = new Camera();
        this.levelData = levelData;
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
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousedown', e => this.tap(e.offsetX, e.offsetY));
        window.addEventListener('mouseup', () => this.mousePressed = false);
        window.addEventListener('mouseenter', () => this.mousePresent = true);
        window.addEventListener('mouseleave', () => this.mousePresent = false);
        window.addEventListener('mousemove', e => this.mouseMove(e.offsetX, e.offsetY));
        window.addEventListener('keydown', e => this.keyDown(e));
        window.addEventListener('keyup', e => this.keyUp(e));
        window.addEventListener('contextmenu', e => e.preventDefault());
        const buttonsWidth = Button.Width * Button.Fullscreen + Button.Gap * (Button.Fullscreen - 1);
        const buttonIncrement = Button.Width + Button.Gap;
        let x = Math.floor((Level.GridWidth - buttonsWidth) / 2);
        const y = Level.GridHeight - Button.Padding - Button.Height;
        for (let type = 0; type < Button.Fullscreen; type++) {
            this.buttons.push(new Button(type, x, y));
            x += buttonIncrement;
        }
        this.buttons.push(new Button(Button.Mute, Button.Padding, y));
        this.buttons.push(new Button(Button.Fullscreen, Level.GridWidth - Button.Padding - Button.Width, y));
        requestAnimationFrame(timestamp => this.loop(timestamp));
    }
    mouseMove(x, y) {
        this.mousePresent = true;
        this.gamePosition = this.gamePoint(x, y);
        this.mousePosition = this.displayPoint(this.gamePosition.x, this.gamePosition.y);
        this.levelCurr.hover(this.gamePosition.x, this.gamePosition.y);
        this.hoverButton = null;
        for (const button of this.buttons) {
            if (button.contains(this.gamePosition.x, this.gamePosition.y)) {
                this.hoverButton = button;
                break;
            }
        }
    }
    resetLevel() {
        this.levelCurr = new Level(this.levelData[this.levelIndex], this.camera);
        this.scrollFrame = 0;
        this.levelCurr.hover(this.gamePosition.x, this.gamePosition.y);
    }
    nextLevel() {
        if (this.levelIndex >= this.levelCount - 3)
            return;
        this.levelIndex++;
        this.levelPrev = new Level(this.levelData[this.levelIndex - 1], this.camera);
        this.levelCurr = new Level(this.levelData[this.levelIndex], this.camera);
        this.levelNext = new Level(this.levelData[this.levelIndex + 1], this.camera);
        this.levelNextNext = new Level(this.levelData[this.levelIndex + 2], this.camera);
        this.scrollFrame = 0;
        this.paused = false;
        this.levelCurr.hover(this.gamePosition.x, this.gamePosition.y);
    }
    previousLevel() {
        if (this.levelIndex <= 1)
            return;
        this.levelIndex--;
        this.levelPrev = new Level(this.levelData[this.levelIndex - 1], this.camera);
        this.levelCurr = new Level(this.levelData[this.levelIndex], this.camera);
        this.levelNext = new Level(this.levelData[this.levelIndex + 1], this.camera);
        this.levelNextNext = new Level(this.levelData[this.levelIndex + 2], this.camera);
        this.scrollFrame = 0;
        this.paused = false;
        this.levelCurr.hover(this.gamePosition.x, this.gamePosition.y);
    }
    toggleFullscreen() {
        const body = document.body;
        if (!document.fullscreenElement) {
            if (body.requestFullscreen) {
                body.requestFullscreen();
            }
        }
        else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    toggleMute() {
        this.muted = !this.muted;
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.muted = this.muted;
        });
    }
    fast() {
        if (this.speedPressed)
            return true;
        const fastButton = this.buttons[Button.Fast];
        return this.mousePressed && fastButton.contains(this.gamePosition.x, this.gamePosition.y);
    }
    togglePause() {
        this.paused = !this.paused;
    }
    keyDown(e) {
        switch (e.code) {
            case 'KeyR':
                this.resetLevel();
                break;
            case 'KeyN':
                this.nextLevel();
                break;
            case 'KeyV':
                this.previousLevel();
                break;
            case 'KeyP':
                this.togglePause();
                break;
            case 'KeyS':
                this.speedPressed = true;
                break;
            case 'KeyF':
                this.toggleFullscreen();
                break;
            case 'KeyM':
                this.toggleMute();
                break;
            case 'KeyU':
                this.levelCurr.popUndoData();
                break;
        }
    }
    keyUp(e) {
        switch (e.code) {
            case 'KeyS': {
                this.speedPressed = false;
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
        console.log(this.tapPoint.x, this.tapPoint.y, Math.floor(this.tapPoint.x / Block.Width), Math.floor(this.tapPoint.y / Block.Height));
        if (!this.musicPlaying) {
            this.musicPlaying = true;
            const ambience = document.getElementById('ambience');
            ambience.volume = 0.5;
            ambience.loop = true;
            ambience.play();
            const music = document.getElementById('music');
            music.volume = 1;
            music.loop = true;
            music.play();
        }
    }
    update() {
        if (this.titleFadeOutFrame > 0
            && this.titleFadeOutFrame < Game.TitleFadeoutFrames) {
            this.titleFadeOutFrame++;
        }
        this.levelCurr.update();
        if (this.levelCurr.complete() && this.levelIndex < this.levelCount - 2) {
            Sounds.playBell();
            this.scrollFrame = 1;
        }
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
                    this.levelCurr.hover(this.gamePosition.x, this.gamePosition.y);
                }
            }
            else {
                if (this.tapped) {
                    let buttonTapped = false;
                    for (const button of this.buttons) {
                        if (!button.contains(this.gamePosition.x, this.gamePosition.y))
                            continue;
                        switch (button.type) {
                            case Button.Reset:
                                this.resetLevel();
                                break;
                            case Button.Next:
                                this.nextLevel();
                                break;
                            case Button.Previous:
                                this.previousLevel();
                                break;
                            case Button.Pause:
                                this.togglePause();
                                break;
                            case Button.Fullscreen:
                                this.toggleFullscreen();
                                break;
                            case Button.Mute:
                                this.toggleMute();
                                break;
                            case Button.Undo:
                                this.levelCurr.popUndoData();
                                break;
                        }
                        buttonTapped = true;
                        break;
                    }
                    // Might be worth allowing clicks during pause
                    if (!buttonTapped && !this.paused) {
                        this.levelCurr.tap(this.tapPoint.x, this.tapPoint.y);
                    }
                    this.tapped = false;
                }
                if (!this.paused) {
                    if (this.fast()) {
                        for (let i = 0; i < Game.FrameSkipCount; i++) {
                            this.update();
                        }
                    }
                    else {
                        this.update();
                    }
                }
            }
            this.camera.update();
            this.render();
        }
        requestAnimationFrame(timestamp => this.loop(timestamp));
    }
    horizontalDisplay() {
        return window.innerWidth * Level.GridHeight > window.innerHeight * Level.GridWidth;
    }
    displayScalar() {
        // if (this.horizontalDisplay()) {
        //     return Math.floor(window.innerHeight / Level.GridHeight)
        // }
        // return Math.floor(window.innerWidth / Level.GridWidth)
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
    render() {
        // Initialize canvases
        const context = this.canvas.getContext('2d');
        const lightContext = this.lightCanvas.getContext('2d');
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        lightContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Create offsets
        const shakeIntensity = this.camera.shakeIntensity;
        const shakeY = Math.round((Math.random() * shakeIntensity * 2 - shakeIntensity) * 10);
        const scrollY = Math.round(this.smooth(this.scrollFrame / Game.ScrollFrames) * Level.GridHeight);
        const offsetY = shakeY + scrollY;
        // Render levels
        this.levelNextNext.render(this.canvas, offsetY);
        this.levelNext.render(this.canvas, Level.GridHeight + offsetY);
        this.levelCurr.render(this.canvas, Level.GridHeight * 2 + offsetY);
        this.levelPrev.render(this.canvas, Level.GridHeight * 3 + offsetY);
        // Prepare light canvas
        lightContext.globalCompositeOperation = 'source-over';
        lightContext.fillStyle = '#000000fd';
        lightContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Reveal lights
        this.levelNextNext.renderLight(this.lightCanvas, offsetY);
        this.levelNext.renderLight(this.lightCanvas, Level.GridHeight + offsetY);
        this.levelCurr.renderLight(this.lightCanvas, Level.GridHeight * 2 + offsetY);
        this.levelPrev.renderLight(this.lightCanvas, Level.GridHeight * 3 + offsetY);
        context.globalCompositeOperation = 'source-over';
        context.drawImage(this.lightCanvas, 0, 0);
        // Add color styling
        context.globalCompositeOperation = 'soft-light';
        context.fillStyle = 'rgba(255, 96, 32, 0.6)';
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        context.globalCompositeOperation = 'source-over';
        // Render buttons
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 0.5;
        for (const button of this.buttons) {
            context.drawImage(Images.ButtonsMap[button.type], button.x, button.y + Level.GridHeight * 2);
        }
        // Render tooltips
        if (this.hoverButton !== null) {
            context.globalCompositeOperation = 'source-over';
            context.globalAlpha = 0.5;
            const renderedText = TextRenderer.paragraphCanvas(Button.HoverTextMap[this.hoverButton.type], Images.Font, Level.GridWidth);
            const w = renderedText.width;
            const h = renderedText.height;
            const y = this.hoverButton.y - 4 - h;
            let x = 0;
            switch (this.hoverButton.type) {
                case Button.Mute:
                    x = Button.Padding;
                    break;
                case Button.Fullscreen:
                    x = Level.GridWidth - Button.Padding - w;
                    break;
                default:
                    x = Math.floor((Level.GridWidth - w) / 2);
                    break;
            }
            context.drawImage(renderedText, x, y + Level.GridHeight * 2);
        }
        // Render text
        this.renderText(context, offsetY);
        // Scale and render to screen
        const displayRect = this.displayRect();
        const screenY = Level.GridHeight * 2;
        this.displayContext.imageSmoothingEnabled = false;
        this.displayContext.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
        this.displayContext.drawImage(this.canvas, 0, screenY, Level.GridWidth, Level.GridHeight, displayRect.x, displayRect.y, displayRect.w, displayRect.h);
        // Render death screen
        this.overlayOpacity = this.levelCurr.deaths > 0 ?
            this.overlayOpacity + (0.25 - this.overlayOpacity) * 0.05 :
            this.overlayOpacity + (0 - this.overlayOpacity) * 0.05;
        this.displayContext.fillStyle = `rgba(255, 0, 0, ${this.overlayOpacity})`;
        this.displayContext.fillRect(displayRect.x, displayRect.y, displayRect.w, displayRect.h);
        // Render title screen
        if (this.titleFadeOutFrame < Game.TitleFadeoutFrames) {
            this.displayContext.globalAlpha = this.smooth(1.0 - this.titleFadeOutFrame / Game.TitleFadeoutFrames);
            // generate falling stars?
            this.displayContext.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.displayContext.fillRect(displayRect.x, displayRect.y, displayRect.w, displayRect.h);
            this.displayContext.drawImage(Images.Title, displayRect.x, displayRect.y, displayRect.w, displayRect.h);
            this.displayContext.globalAlpha = 1.0;
        }
        // Render mouse
        this.renderMouse();
    }
    renderMouse() {
        if (this.mousePresent) {
            const displayScalar = this.displayScalar();
            const image = this.mousePressed ? Images.CursorClosed : Images.Cursor;
            this.displayContext.drawImage(image, Math.floor(this.mousePosition.x - 3 * displayScalar), // Adjustment for cursor image
            Math.floor(this.mousePosition.y), Images.Cursor.width * displayScalar, Images.Cursor.height * displayScalar);
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
