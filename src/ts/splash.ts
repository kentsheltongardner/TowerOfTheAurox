export default class Splash {
    x:  number
    y:  number
    vx: number
    vy: number
    constructor(x: number, y: number, vx: number, vy: number) {
        this.x  = x
        this.y  = y
        this.vx = vx
        this.vy = vy
    }
    update() {
        this.vy += 0.75
        this.x  += this.vx
        this.y  += this.vy
    }

    clone(): Splash {
        return new Splash(this.x, this.y, this.vx, this.vy)
    }
}