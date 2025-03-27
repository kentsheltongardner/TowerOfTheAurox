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

export default class Game {

    public static readonly AmbientGradientRadius    = Math.hypot(Level.GridCenterX, Level.GridCenterY)
    public static readonly SplatterRGB              = '#9f040460'
    public static readonly DebrisRGBPrefix          = 'rgba(115, 65, 32, '
    public static readonly TargetFPS                = 60
    public static readonly FrameTimeMilliseconds    = 1000 / Game.TargetFPS
    public static readonly ScrollTimeMilliseconds   = 1000
    public static readonly ScrollFrames             = Math.floor(Game.ScrollTimeMilliseconds / Game.FrameTimeMilliseconds)
    public static readonly FrameSkipCount           = 8

    public canvasPrev:      HTMLCanvasElement
    public canvasCurr:      HTMLCanvasElement
    public canvasNext:      HTMLCanvasElement
    public canvasAll:       HTMLCanvasElement

    public contextPrev:     CanvasRenderingContext2D
    public contextCurr:     CanvasRenderingContext2D
    public contextNext:     CanvasRenderingContext2D
    public contextAll:      CanvasRenderingContext2D

    public displayCanvas:   HTMLCanvasElement
    public displayContext:  CanvasRenderingContext2D
    public levelIndex:      number
    public levelPrev:       Level
    public levelCurr:       Level
    public levelNext:       Level
    public levelData:       LevelData[]
    public musicPlaying:    boolean
    public lastTimestamp:   number
    public frame:           number
    public scrollFrame:     number
    public tapPoint:        Point
    public tapped:          boolean
    public camera:          Camera
    public overlayOpacity:  number
    public skip:            boolean

    // Numeric scroll system based on direction of movement (up or down)

    constructor(levelData: LevelData[], displayCanvas: HTMLCanvasElement) {
        this.camera             = new Camera()
        this.levelData          = levelData
        this.levelIndex         = 1
        this.levelPrev          = new Level(this.levelData[this.levelIndex - 1], this.camera)
        this.levelCurr          = new Level(this.levelData[this.levelIndex], this.camera)
        this.levelNext          = new Level(this.levelData[this.levelIndex + 1], this.camera)

        this.canvasPrev         = document.createElement('canvas')
        this.canvasCurr         = document.createElement('canvas')
        this.canvasNext         = document.createElement('canvas')
        this.canvasAll          = document.createElement('canvas')

        this.contextPrev        = this.canvasPrev.getContext('2d')!
        this.contextCurr        = this.canvasCurr.getContext('2d')!
        this.contextNext        = this.canvasNext.getContext('2d')!
        this.contextAll         = this.canvasAll.getContext('2d')!

        this.canvasPrev.width   = Level.GridWidth
        this.canvasCurr.width   = Level.GridWidth
        this.canvasNext.width   = Level.GridWidth
        this.canvasAll.width    = Level.GridWidth

        this.canvasPrev.height  = Level.GridHeight
        this.canvasCurr.height  = Level.GridHeight
        this.canvasNext.height  = Level.GridHeight
        this.canvasAll.height   = Level.GridHeight * 3

        this.displayCanvas      = displayCanvas
        this.displayContext     = this.displayCanvas.getContext('2d')!

        this.musicPlaying       = false
        this.lastTimestamp      = 0
        this.frame              = 0
        this.scrollFrame        = 0
        this.tapPoint           = new Point(0, 0)
        this.tapped             = false
        this.overlayOpacity     = 0
        this.skip               = false

        this.resize()
        window.addEventListener('resize',       () => { this.resize() })
        window.addEventListener('mousedown',    e => { this.tap(e) })
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
                this.levelIndex++
                this.levelPrev      = new Level(this.levelData[this.levelIndex - 1], this.camera)
                this.levelCurr      = new Level(this.levelData[this.levelIndex], this.camera)
                this.levelNext      = new Level(this.levelData[this.levelIndex + 1], this.camera)
                this.scrollFrame    = 0
                this.overlayOpacity = 0
                break
            }
            case 'KeyP': {
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

    tap(e: MouseEvent) {
        this.tapped     = true
        this.tapPoint   = this.gamePoint(e.offsetX, e.offsetY)
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
        if (this.frame % 1 === 0) {
            this.levelCurr.update(this.frame)
        }

        if (this.levelCurr.complete()) {
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









    renderLevel(level: Level, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, frame: number) {
        context.clearRect(0, 0, canvas.width, canvas.height)

        const rng = new RNG()
        context.fillStyle = '#0002'

        for (let i = 0; i < Level.GridWidth; i += Level.BrickWidth) {
            for (let j = 0; j < Level.GridHeight; j += Level.BrickHeight * 2) {
                context.drawImage(Images.Brick, i, j)
                if (rng.nextInt() % 3 === 0) {
                    context.fillRect(i, j, Level.BrickWidth, Level.BrickHeight)
                }
            }
        }
        for (let i = -Level.BrickWidth / 2; i < Level.GridWidth; i += Level.BrickWidth) {
            for (let j = Level.BrickHeight; j < Level.GridHeight; j += Level.BrickHeight * 2) {
                context.drawImage(Images.Brick, i, j)
                if (rng.nextInt() % 3 === 0) {
                    context.fillRect(i, j, Level.BrickWidth, Level.BrickHeight)
                }
            }
        }

        context.strokeStyle = 'red'
        context.beginPath()
        for (const beam of level.beams()) {
            context.moveTo(beam.x, beam.y)
            context.lineTo(beam.x + beam.w, beam.y + beam.h)
        }
        context.stroke()

        for (const walker of level.walkers) {
            const offsetX       = (Math.floor(frame / 3) + walker.frameOffset) % Walker.Frames
            const spriteSheet   = walker.walkDirection === 1 ? Images.WalkerRight : Images.WalkerLeft
            context.drawImage(
                spriteSheet, 
                offsetX * Walker.Width, 
                0, 
                Walker.Width, 
                Walker.Height,
                walker.x, 
                walker.y, 
                Walker.Width, 
                Walker.Height)
        }

        for (const creeper of level.creepers) {
            const offsetX       = (Math.floor(frame / 3) + creeper.frameOffset) % Creeper.Frames
            const spriteSheet   = creeper.walkDirection === 1 ? Images.CreeperRight : Images.CreeperLeft
            context.drawImage(
                spriteSheet, 
                offsetX * Creeper.Width, 
                0, 
                Creeper.Width, 
                Creeper.Height,
                creeper.x, 
                creeper.y, 
                Creeper.Width, 
                Creeper.Height)
        }

        for (const block of level.blocks) {
            if (block.invisible) continue
            
            if (block.ethereal) {
                context.globalAlpha = 0.25
            }
            switch (block.type) {
                case Block.Goal: {
                    context.drawImage(Images.Aurox, block.x, block.y)
                    break
                }
                case Block.Portal: {
                    context.drawImage(
                        Images.Portals, 
                        block.color * Block.Width, 
                        0, 
                        Block.Width, 
                        Block.Height,
                        block.x, 
                        block.y, 
                        Block.Width, 
                        Block.Height)
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
                        block.y, 
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
                        block.y, 
                        Block.Width, 
                        Block.Height)
                    break
                }
            }
            context.globalAlpha = 1.0
            
            if (block.softConnections === 0) continue

            context.drawImage(
                Images.StrappingTileset, 
                Images.OffsetMap[block.softConnections] * Block.Width, 
                0, 
                Block.Width, 
                Block.Height,
                block.x, 
                block.y, 
                Block.Width, 
                Block.Height)
        }

        context.fillStyle = 'white'
        for (let i = 0; i < level.blocks.length; i++) {
            const block = level.blocks[i]
            const x     = block.x
            const y     = block.y
            const group = level.groupIndex[i]
            // context.fillText(group + '', x + 7, y + 18)
            // context.fillText(i + '', x + 2, y + 18)
        }

        for (const block of level.blocks) {
            context.fillStyle = Game.SplatterRGB
            for (const splatter of block.splatters) {
                const x = block.x + Math.floor(splatter.x)
                const y = block.y + Math.floor(splatter.y)
                context.fillRect(x, y, 1, 1)
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

        context.fillStyle = Game.SplatterRGB
        for (const splatter of level.splatters) {
            const x = Math.floor(splatter.x)
            const y = Math.floor(splatter.y)
            context.fillRect(x, y, 1, 1)
        }

        for (const debris of level.debris) {
            const x             = Math.floor(debris.x)
            const y             = Math.floor(debris.y)
            const opacity       = 1.0 / debris.frame
            context.fillStyle   = `${Game.DebrisRGBPrefix} ${ opacity })`
            context.fillRect(x, y, 1, 1)
        }

        // xor, multiply, overlay, darken, soft-light, hue, color
        context.globalCompositeOperation = 'multiply'
        context.fillStyle = 'rgba(255, 128, 64, 0.6)'
        context.fillRect(0, 0, Level.GridWidth, Level.GridHeight)
        context.globalCompositeOperation = 'source-over'
    }



    render(frame: number) {
        this.renderLevel(this.levelPrev, this.canvasPrev, this.contextPrev, 0)
        this.renderLevel(this.levelCurr, this.canvasCurr, this.contextCurr, frame)
        this.renderLevel(this.levelNext, this.canvasNext, this.contextNext, 0)

        this.contextAll.clearRect(0, 0, this.canvasAll.width, this.canvasAll.height)
        
        this.contextAll.drawImage(this.canvasNext, 0, 0)
        this.contextAll.drawImage(this.canvasCurr, 0, Level.GridHeight)
        this.contextAll.drawImage(this.canvasPrev, 0, Level.GridHeight * 2)

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
    }

    smooth(x: number) {
        const sin = Math.sin(Math.PI * x / 2)
        return sin * sin
    }
}