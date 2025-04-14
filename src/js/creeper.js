import Mover from './mover.js';
import RNG from './rng.js';
export default class Creeper extends Mover {
    static Frames = 6;
    static Width = 10;
    static Height = 6;
    frameOffset;
    killed;
    constructor(x, y, direction) {
        super(x, y, direction);
        this.frameOffset = ((new RNG()).nextInt() + x + y) % Creeper.Frames;
        this.killed = false;
    }
    width() {
        return Creeper.Width;
    }
    height() {
        return Creeper.Height;
    }
    clone() {
        const clone = Object.create(Creeper.prototype);
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
