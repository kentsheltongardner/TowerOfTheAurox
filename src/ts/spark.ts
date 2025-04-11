export default class Spark {
    public static FallSpeed     = 0.2

    public x:       number
    public y:       number
    public vx:      number
    public vy:      number
    public life:    number
    public frame:   number = 0
    constructor(x: number, y: number, vx: number, vy: number) {
        this.x      = x
        this.y      = y
        this.vx     = vx
        this.vy     = vy
        this.life   = 10 + Math.floor(Math.random() * 30)
    }

    clone(): Spark {
        const clone = Object.create(Spark.prototype) as Spark
        Object.assign(clone, {
            x:      this.x,
            y:      this.y,
            vx:     this.vx,
            vy:     this.vy,
            life:   this.life,
            frame:  this.frame,
        })
        return clone
    }
}