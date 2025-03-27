import Mover from './mover.js';
export default class Creeper extends Mover {
    static Frames = 6;
    static Width = 10;
    static Height = 6;
    frameOffset;
    killed;
    constructor(x, y, direction) {
        super(x, y, direction);
        this.frameOffset = Math.floor(Math.random() * Creeper.Frames);
        this.killed = false;
    }
    width() {
        return Creeper.Width;
    }
    height() {
        return Creeper.Height;
    }
}
