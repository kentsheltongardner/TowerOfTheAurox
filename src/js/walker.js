import Mover from './mover.js';
export default class Walker extends Mover {
    static Frames = 8;
    static Width = 6;
    static Height = 10;
    frameOffset;
    constructor(x, y, direction) {
        super(x, y, direction);
        this.frameOffset = Math.floor(Math.random() * Walker.Frames);
    }
    width() {
        return Walker.Width;
    }
    height() {
        return Walker.Height;
    }
}
