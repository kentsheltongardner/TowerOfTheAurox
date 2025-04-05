export default class Drop {
    x;
    y;
    vy = 0;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    update() {
        this.vy += 0.75;
        this.y += this.vy;
    }
}
