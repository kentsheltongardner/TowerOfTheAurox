export default abstract class Faller {
    public x:           number
    public y:           number
    public vy:          number

    constructor(x: number, y: number) {
        this.x          = x
        this.y          = y
        this.vy         = 0
    }
}