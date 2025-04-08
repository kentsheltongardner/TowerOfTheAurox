export default class Spark {
    public static FallSpeed     = 0.2

    public x:       number
    public y:       number
    public vx:      number
    public vy:      number
    public frame:   number = 0
    public life:    number
    constructor(x: number, y: number, vx: number, vy: number) {
        this.x      = x
        this.y      = y
        this.vx     = vx
        this.vy     = vy
        this.life   = 10 + Math.floor(Math.random() * 30)
    }
}