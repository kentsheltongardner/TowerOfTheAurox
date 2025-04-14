import Block from './block.js'
import RNG from './rng.js'

export default class Torch {
    public x:       number
    public y:       number
    public frame:   number
    constructor(x: number, y: number) {
        this.x      = x * Block.Width
        this.y      = y * Block.Height
        this.frame  = ((new RNG()).nextInt() + x + y) % 5
    }
}