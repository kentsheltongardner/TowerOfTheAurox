export default class Splash {
    x;
    y;
    vx;
    vy;
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }
    update() {
        this.vy += 0.75;
        this.x += this.vx;
        this.y += this.vy;
    }
    clone() {
        return new Splash(this.x, this.y, this.vx, this.vy);
    }
}
