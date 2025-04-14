import Mover from './mover.js';
import RNG from './rng.js';
export default class Walker extends Mover {
    static Frames = 8;
    static Width = 6;
    static Height = 10;
    frameOffset;
    constructor(x, y, direction) {
        super(x, y, direction);
        this.frameOffset = ((new RNG()).nextInt() + x + y) % Walker.Frames;
    }
    width() {
        return Walker.Width;
    }
    height() {
        return Walker.Height;
    }
    clone() {
        const clone = Object.create(Walker.prototype);
        Object.assign(clone, {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            walkDirection: this.walkDirection,
            frameOffset: this.frameOffset,
            grounded: this.grounded,
            step: this.step,
            stepTotal: this.stepTotal,
            fallDirection: this.fallDirection,
        });
        return clone;
    }
}
