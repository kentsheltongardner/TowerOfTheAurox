export default class Debris {
    public static SpeedMinimum  = 0.25
    public static SpeedMaximum  = 5
    public static CountMinimum  = 200
    public static CountMaximum  = 250
    public static FallSpeed     = 0.2

    public x:       number
    public y:       number
    public vx:      number
    public vy:      number

    constructor(x: number, y: number, vx: number, vy: number) {
        this.x  = x
        this.y  = y
        this.vx = vx
        this.vy = vy
    }

    clone() {
        return new Debris(this.x, this.y, this.vx, this.vy)
    }
}