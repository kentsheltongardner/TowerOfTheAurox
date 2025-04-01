import Block from './block.js';
export default class Torch {
    x;
    y;
    frame;
    constructor(x, y) {
        this.x = x * Block.Width;
        this.y = y * Block.Height;
        this.frame = Math.floor(Math.random() * 5);
    }
}
