import Mover from './mover.js'

export default class Walker extends Mover {
    static readonly Frames  = 8
    static readonly Width   = 6
    static readonly Height  = 10

    public frameOffset:     number
    public saved:           boolean
    public killed:          boolean

    constructor(x: number, y: number, direction: number) {
        super(x, y, direction)
        this.frameOffset    = Math.floor(Math.random() * Walker.Frames)
        this.saved          = false
        this.killed         = false
    }

    width() {
        return Walker.Width
    }
    height() {
        return Walker.Height
    }
}