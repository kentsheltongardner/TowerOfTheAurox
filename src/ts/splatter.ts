export default class Splatter {
    public static SpeedMinimum  = 0.25
    public static SpeedMaximum  = 5
    public static CountMinimum  = 70
    public static CountMaximum  = 90
    public static FallSpeed     = 0.4

    public x:           number
    public y:           number
    public vx:          number
    public vy:          number
    public splattered:  boolean

    constructor(x: number, y: number, vy: number) {
        this.x          = x
        this.y          = y
        const theta     = Math.PI + Math.random() * Math.PI
        const speed     = Splatter.SpeedMinimum + Math.random() * (Splatter.SpeedMaximum - Splatter.SpeedMinimum)
        this.vx         = Math.cos(theta) * speed
        this.vy         = Math.sin(theta) * speed + vy
        this.splattered = false
    }

    clone(): Splatter {
        const clone = Object.create(Splatter.prototype) as Splatter
        Object.assign(clone, {
            x:          this.x,
            y:          this.y,
            vx:         this.vx,
            vy:         this.vy,
            splattered: this.splattered,
        })
        return clone
    }
}