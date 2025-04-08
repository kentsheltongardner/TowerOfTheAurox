export default class Spark {
    static FallSpeed = 0.2;
    x;
    y;
    vx;
    vy;
    frame = 0;
    life;
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 10 + Math.floor(Math.random() * 30);
    }
}
