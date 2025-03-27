import Block from './block.js';
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
    frame;
    constructor(block) {
        this.x = block.x + Math.random() * Block.Width;
        this.y = block.y + Math.random() * Block.Height;
        const theta = Math.random() * Math.PI * 2;
        const speed = Debris.SpeedMinimum + Math.random() * (Debris.SpeedMaximum - Debris.SpeedMinimum);
        this.vx = Math.cos(theta) * speed * 2.0;
        this.vy = Math.sin(theta) * speed;
        this.frame = 0;
    }
}
