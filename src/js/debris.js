export default class Debris {
    static SpeedMinimum = 0.25;
    static SpeedMaximum = 5;
    static CountMinimum = 200;
    static CountMaximum = 250;
    static FallSpeed = 0.2;
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
    clone() {
        return new Debris(this.x, this.y, this.vx, this.vy);
    }
}
