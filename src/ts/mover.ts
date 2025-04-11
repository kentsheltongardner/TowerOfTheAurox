import Faller from './faller.js'

export default abstract class Mover extends Faller {
    public walkDirection:       number
    public grounded:            boolean = false
    public step:                number  = 0
    public stepTotal:           number  = 0
    public fallDirection:       number  = 0
    public vx:                  number  = 0

    constructor(x: number, y: number, walkDirection: number) {
        super(x, y)
        this.walkDirection  = walkDirection
        this.vx             = walkDirection
    }

    setStepVariables() {
        this.step           = 1
        this.stepTotal      = Math.abs(this.vy)
        this.fallDirection  = Math.sign(this.vy)
    }

    abstract width(): number
    abstract height(): number
}