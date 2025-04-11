import Faller from './faller.js';
export default class Mover extends Faller {
    walkDirection;
    grounded = false;
    step = 0;
    stepTotal = 0;
    fallDirection = 0;
    vx = 0;
    constructor(x, y, walkDirection) {
        super(x, y);
        this.walkDirection = walkDirection;
        this.vx = walkDirection;
    }
    setStepVariables() {
        this.step = 1;
        this.stepTotal = Math.abs(this.vy);
        this.fallDirection = Math.sign(this.vy);
    }
}
