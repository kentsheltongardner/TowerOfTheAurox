export default class Droplet {
    public x:       number
    public y:       number
    public vy:      number = 0
    constructor(x: number, y: number) {
        this.x      = x
        this.y      = y
    }

    clone(): Droplet {
        const clone = Object.create(Droplet.prototype) as Droplet
        Object.assign(clone, {
            x:      this.x,
            y:      this.y,
            vy:     this.vy,
        })
        return clone
    }
}