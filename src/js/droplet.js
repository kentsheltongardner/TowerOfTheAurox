export default class Droplet {
    x;
    y;
    vy = 0;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    clone() {
        const clone = Object.create(Droplet.prototype);
        Object.assign(clone, {
            x: this.x,
            y: this.y,
            vy: this.vy,
        });
        return clone;
    }
}
