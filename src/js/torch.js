import Block from './block.js';
import RNG from './rng.js';
export default class Torch {
    x;
    y;
    frame;
    constructor(x, y) {
        this.x = x * Block.Width;
        this.y = y * Block.Height;
        this.frame = ((new RNG()).nextInt() + x + y) % 5;
    }
}
