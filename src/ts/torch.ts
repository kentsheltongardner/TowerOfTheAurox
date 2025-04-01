import Block from './block.js'

export default class Torch {
    public x: number
    public y: number
    public frame: number
    constructor(x: number, y: number) {
        this.x = x * Block.Width
        this.y = y * Block.Height
        this.frame = Math.floor(Math.random() * 5)
    }
}