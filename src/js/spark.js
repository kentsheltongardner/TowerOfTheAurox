export default class Spark {
    static FallSpeed = 0.2;
    x;
    y;
    vx;
    vy;
    life;
    frame = 0;
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 10 + Math.floor(Math.random() * 30);
    }
    clone() {
        const clone = Object.create(Spark.prototype);
        Object.assign(clone, {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            life: this.life,
            frame: this.frame,
        });
        return clone;
    }
}
