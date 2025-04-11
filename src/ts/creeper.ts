import Mover from './mover.js'

export default class Creeper extends Mover {
    static readonly Frames  = 6
    static readonly Width   = 10
    static readonly Height  = 6

    public frameOffset: number
    public killed:      boolean

    constructor(x: number, y: number, direction: number) {
        super(x, y, direction)
        this.frameOffset    = Math.floor(Math.random() * Creeper.Frames)
        this.killed         = false
    }

    width() {
        return Creeper.Width
    }
    height() {
        return Creeper.Height
    }

    clone(): Creeper {
        const clone = Object.create(Creeper.prototype) as Creeper
        Object.assign(clone, {
            x:              this.x,
            y:              this.y,
            vx:             this.vx,
            vy:             this.vy,
            walkDirection:  this.walkDirection,
            frameOffset:    this.frameOffset,
            grounded:       this.grounded,
            step:           this.step,
            stepTotal:      this.stepTotal,
            fallDirection:  this.fallDirection,
        })
        return clone
    }
}