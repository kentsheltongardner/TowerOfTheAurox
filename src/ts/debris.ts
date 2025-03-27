import Block from './block.js'

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
    public frame:   number

    constructor(block: Block) {
        this.x          = block.x + Math.random() * Block.Width
        this.y          = block.y + Math.random() * Block.Height
        const theta     = Math.random() * Math.PI * 2
        const speed     = Debris.SpeedMinimum + Math.random() * (Debris.SpeedMaximum - Debris.SpeedMinimum)
        this.vx         = Math.cos(theta) * speed * 2.0
        this.vy         = Math.sin(theta) * speed
        this.frame      = 0
    }
}