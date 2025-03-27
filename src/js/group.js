export default class Group {
    blocks = [];
    vy = 0;
    step = 0;
    stepTotal = 0;
    fallDirection = 0;
    constructor(blocks) {
        this.vy = blocks[0].vy;
    }
    setStepVariables() {
        this.step = 1;
        this.stepTotal = Math.abs(this.vy);
        this.fallDirection = Math.sign(this.vy);
    }
}
