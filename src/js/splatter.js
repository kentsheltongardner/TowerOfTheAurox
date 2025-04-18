export default class Splatter {
    static SpeedMinimum = 0.25;
    static SpeedMaximum = 5;
    static CountMinimum = 70;
    static CountMaximum = 90;
    static FallSpeed = 0.4;
    x;
    y;
    vx;
    vy;
    splattered;
    constructor(x, y, vy) {
        this.x = x;
        this.y = y;
        const theta = Math.PI + Math.random() * Math.PI;
        const speed = Splatter.SpeedMinimum + Math.random() * (Splatter.SpeedMaximum - Splatter.SpeedMinimum);
        this.vx = Math.cos(theta) * speed;
        this.vy = Math.sin(theta) * speed + vy;
        this.splattered = false;
    }
    clone() {
        const clone = Object.create(Splatter.prototype);
        Object.assign(clone, {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            splattered: this.splattered,
        });
        return clone;
    }
}
