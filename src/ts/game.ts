import LevelData    from './level_data.js'
import Level        from './level.js'
import Rect         from './rect.js'
import Point        from './point.js'
import Images       from './images.js'
import Camera       from './camera.js'
import Sounds       from './sounds.js'
import Block        from './block.js'
import RNG          from './rng.js'
import Walker       from './walker.js'
import Creeper      from './creeper.js'
import Color from './color.js'
import TextRenderer from './text.js'

export default class Game {

    public static readonly Tau                      = Math.PI * 2
    public static readonly AmbientGradientRadius    = Math.hypot(Level.GridCenterX, Level.GridCenterY)
    public static readonly SplatterRGB              = '#9f040460'
    public static readonly DebrisRGBPrefix          = 'rgba(115, 65, 32, '
    public static readonly TargetFPS                = 60
    public static readonly FrameTimeMilliseconds    = 1000 / Game.TargetFPS
    public static readonly ScrollTimeMilliseconds   = 1000
    public static readonly ScrollFrames             = Math.floor(Game.ScrollTimeMilliseconds / Game.FrameTimeMilliseconds)
    public static readonly FrameSkipCount           = 8
    public static readonly TitleFadeoutMilliseconds = 500
    public static readonly TitleFadeoutFrames       = Math.floor(Game.TitleFadeoutMilliseconds / Game.FrameTimeMilliseconds)

    // public canvasPrev:          HTMLCanvasElement
    // public canvasCurr:          HTMLCanvasElement
    // public canvasNext:          HTMLCanvasElement
    public canvasAll:           HTMLCanvasElement



    public displayCanvas:       HTMLCanvasElement
    public displayContext:      CanvasRenderingContext2D
    public levelIndex:          number
    public levelCount:          number
    public levelPrev:           Level
    public levelCurr:           Level
    public levelNext:           Level
    public levelData:           LevelData[]
    public musicPlaying:        boolean
    public lastTimestamp:       number
    public frame:               number
    public titleFadeOutFrame:   number
    public scrollFrame:         number
    public tapPoint:            Point
    public tapped:              boolean
    public camera:              Camera
    public overlayOpacity:      number
    public skip:                boolean

    // Numeric scroll system based on direction of movement (up or down)

    constructor(levelData: LevelData[], displayCanvas: HTMLCanvasElement) {
        this.camera             = new Camera()
        this.levelData          = levelData
        this.levelIndex         = 1
        this.levelCount         = this.levelData.length
        this.levelPrev          = new Level(this.levelData[this.levelIndex - 1], this.camera)
        this.levelCurr          = new Level(this.levelData[this.levelIndex], this.camera)
        this.levelNext          = new Level(this.levelData[this.levelIndex + 1], this.camera)

        // this.canvasPrev         = document.createElement('canvas')
        // this.canvasCurr         = document.createElement('canvas')
        // this.canvasNext         = document.createElement('canvas')
        this.canvasAll          = document.createElement('canvas')


        // this.canvasPrev.width           = Level.GridWidth
        // this.canvasCurr.width           = Level.GridWidth
        // this.canvasNext.width           = Level.GridWidth
        this.canvasAll.width            = Level.GridWidth

        // this.canvasPrev.height          = Level.GridHeight
        // this.canvasCurr.height          = Level.GridHeight
        // this.canvasNext.height          = Level.GridHeight
        this.canvasAll.height           = Level.GridHeight * 3

        this.displayCanvas      = displayCanvas
        this.displayContext     = this.displayCanvas.getContext('2d')!

        this.musicPlaying       = false
        this.lastTimestamp      = 0
        this.frame              = 0
        this.scrollFrame        = 0
        this.titleFadeOutFrame  = 0
        this.tapPoint           = new Point(0, 0)
        this.tapped             = false
        this.overlayOpacity     = 0
        this.skip               = false

        this.resize()
        window.addEventListener('resize',       () => { this.resize() })
        window.addEventListener('mousedown',    e => { this.tap(e.offsetX, e.offsetY) })
        window.addEventListener('touchstart',   e => {
            const touch = e.touches[0]
            this.tap(touch.clientX, touch.clientY) 
        })
        window.addEventListener('keydown',      e => { this.keyDown(e) })
        window.addEventListener('keyup',        e => { this.keyUp(e) })
        window.addEventListener('contextmenu',  e => e.preventDefault())


        requestAnimationFrame(timestamp => this.loop(timestamp))
    }

    keyDown(e: KeyboardEvent) {
        switch (e.code) {
            case 'KeyR': {
                this.levelCurr      = new Level(this.levelData[this.levelIndex], this.camera)
                this.scrollFrame    = 0
                this.overlayOpacity = 0
                break
            }
            case 'KeyN': {
                if (this.levelIndex >= this.levelCount - 2) break

                this.levelIndex++
                this.levelPrev      = new Level(this.levelData[this.levelIndex - 1], this.camera)
                this.levelCurr      = new Level(this.levelData[this.levelIndex], this.camera)
                this.levelNext      = new Level(this.levelData[this.levelIndex + 1], this.camera)
                this.scrollFrame    = 0
                this.overlayOpacity = 0
                break
            }
            case 'KeyP': {
                if (this.levelIndex <= 1) break

                this.levelIndex--
                this.levelPrev      = new Level(this.levelData[this.levelIndex - 1], this.camera)
                this.levelCurr      = new Level(this.levelData[this.levelIndex], this.camera)
                this.levelNext      = new Level(this.levelData[this.levelIndex + 1], this.camera)
                this.scrollFrame    = 0
                this.overlayOpacity = 0
                break
            }
            case 'KeyF': {
                this.skip = true
                break
            }
        }
    }

    keyUp(e: KeyboardEvent) {
        switch (e.code) {
            case 'KeyF': {
                this.skip = false
                break
            }
        }
    }

    
    tap(x: number, y: number) {
        if (this.titleFadeOutFrame === 0) {
            this.titleFadeOutFrame = 1
            return
        }
        if (this.titleFadeOutFrame < Game.TitleFadeoutFrames) {
            return
        }

        this.tapped     = true
        this.tapPoint   = this.gamePoint(x, y)
        console.log(this.tapPoint.x, this.tapPoint.y)

        if (!this.musicPlaying) {
            this.musicPlaying = true
            const audio = new Audio('./res/music/ambience.mp3')
            audio.volume = 0.5
            audio.loop = true
            audio.play()
        }
    }

    update() {
        if (this.titleFadeOutFrame > 0 
            && this.titleFadeOutFrame < Game.TitleFadeoutFrames) {
            this.titleFadeOutFrame++
        }

        if (this.frame % 1 === 0) {
            this.levelCurr.update(this.frame)
        }

        if (this.levelCurr.complete() && this.levelIndex < this.levelCount - 2) {
            Sounds.playBell()
            this.scrollFrame = 1
        }
        this.frame++
    }
    loop(timestamp: number) {
        if (timestamp - this.lastTimestamp >= Game.FrameTimeMilliseconds) {
            this.lastTimestamp = timestamp
            if (this.scrollFrame > 0) {
                this.scrollFrame++

                if (this.scrollFrame === Game.ScrollFrames) {
                    this.levelIndex++
                    this.levelPrev = this.levelCurr
                    this.levelCurr = new Level(this.levelData[this.levelIndex], this.camera)
                    this.levelNext = new Level(this.levelData[this.levelIndex + 1], this.camera)
                    this.scrollFrame = 0
                }
            } else {
                if (this.tapped) {
                    this.levelCurr.tap(this.tapPoint.x, this.tapPoint.y)
                    this.tapped = false
                }
                if (this.skip) {
                    for (let i = 0; i < Game.FrameSkipCount; i++) {
                        this.update()
                    }
                } else {
                    this.update()
                }
            }
            this.camera.update()

            this.render(this.frame)
        }
        requestAnimationFrame(timestamp => this.loop(timestamp))
    }



    horizontalDisplay() {
        return window.innerWidth * Level.GridHeight > window.innerHeight * Level.GridWidth
    }

    displayScalar() {
        if (this.horizontalDisplay()) {
            return window.innerHeight / Level.GridHeight
        }
        return window.innerWidth / Level.GridWidth
    }

    displayRect() {
        const scalar    = this.displayScalar()
        const width     = Math.floor(Level.GridWidth * scalar)
        const height    = Math.floor(Level.GridHeight * scalar)
        const x         = Math.floor((window.innerWidth - width) / 2.0)
        const y         = Math.floor((window.innerHeight - height) / 2.0)
        return new Rect(x, y, width, height)
    }

    gamePoint(displayX: number, displayY: number) {
        const scalar    = this.displayScalar()
        const rect      = this.displayRect()
        const x         = Math.floor((displayX - rect.x) / scalar)
        const y         = Math.floor((displayY - rect.y) / scalar)
        
        return new Point(x, y)
    }

    resize() {
        this.displayCanvas.width    = window.innerWidth
        this.displayCanvas.height   = window.innerHeight
    }







    render(frame: number) {
        this.levelPrev.render(0)
        this.levelCurr.render(frame)
        this.levelNext.render(0)

        const contextAll = this.canvasAll.getContext('2d')!
        contextAll.clearRect(0, 0, this.canvasAll.width, this.canvasAll.height)
        
        contextAll.drawImage(this.levelNext.canvas, 0, 0)
        contextAll.drawImage(this.levelCurr.canvas, 0, Level.GridHeight)
        contextAll.drawImage(this.levelPrev.canvas, 0, Level.GridHeight * 2)

        const displayRect       = this.displayRect()
        const displayScalar     = this.displayScalar()
        const shakeIntensity    = this.camera.shakeIntensity
        const shakeY            = Math.round((Math.random() * shakeIntensity * 2 - shakeIntensity) * displayScalar)
        const scrollY           = Math.round(this.smooth(this.scrollFrame / Game.ScrollFrames) * Level.GridHeight)
        const offsetY           = Level.GridHeight - scrollY + shakeY

        this.displayContext.imageSmoothingEnabled = false
        this.displayContext.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height)
        this.displayContext.drawImage(
            this.canvasAll, 
            0, 
            offsetY, 
            Level.GridWidth, 
            Level.GridHeight, 
            displayRect.x,
            displayRect.y,
            displayRect.w, 
            displayRect.h
        )

        this.overlayOpacity = this.levelCurr.deaths > 0 ? 
            this.overlayOpacity + (0.25 - this.overlayOpacity) * 0.05 :
            this.overlayOpacity + (0 - this.overlayOpacity) * 0.05

        this.displayContext.fillStyle = `rgba(255, 0, 0, ${this.overlayOpacity})`
        this.displayContext.fillRect(displayRect.x, displayRect.y, displayRect.w, displayRect.h)

        if (this.titleFadeOutFrame < Game.TitleFadeoutFrames) {
            this.displayContext.globalAlpha = this.smooth(1.0 - this.titleFadeOutFrame / Game.TitleFadeoutFrames)
            // generate falling stars?
            this.displayContext.fillStyle = 'rgba(0, 0, 0, 0.75)'
            this.displayContext.fillRect(displayRect.x, displayRect.y, displayRect.w, displayRect.h)
            this.displayContext.drawImage(Images.Title, displayRect.x, displayRect.y, displayRect.w, displayRect.h)
            this.displayContext.globalAlpha = 1.0
        }
    }

    smooth(x: number) {
        const sin = Math.sin(Math.PI * x / 2)
        return sin * sin
    }
}