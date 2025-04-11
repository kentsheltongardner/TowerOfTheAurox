import Faller from './faller.js';
import Connection from './connection.js';
import Color from './color.js';
export default class Block extends Faller {
    static Width = 20;
    static Height = 30;
    static None = -1;
    static Wall = 0;
    static Clay = 1;
    static Crate = 2;
    static Box = 3;
    static Magnet = 4;
    static Beam = 5;
    static Ice = 6;
    static Aurox = 7;
    static TypeCount = 8;
    static CharToType = {
        '.': Block.None,
        '#': Block.Wall,
        '*': Block.Clay,
        '$': Block.Crate,
        '%': Block.Box,
        '+': Block.Magnet,
        '!': Block.Beam,
        '@': Block.Ice,
        '&': Block.Aurox,
    };
    static TypeIsDestructible = [
        false,
        true,
        false,
        true,
        false,
        false,
        true,
        false,
    ];
    static TypeFalls = [
        false,
        false,
        true,
        true,
        true,
        true,
        true,
        true,
    ];
    type;
    hardConnections = 0;
    softConnections = 0;
    direction = Connection.None;
    color = Color.None;
    invisible = false;
    altar = false;
    warp = false;
    splatters = [];
    message = '';
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
    }
    setAttribute(char) {
        if (char in Color.CharToColor) {
            this.color = Color.CharToColor[char];
            this.warp = true;
            return;
        }
        if (char in Connection.CharToDirection) {
            this.direction = Connection.CharToDirection[char];
            return;
        }
        switch (char) {
            case 'I': {
                this.invisible = true;
                break;
            }
            case 'A': {
                this.altar = true;
                break;
            }
        }
    }
    clone() {
        const clone = Object.create(Block.prototype);
        const splatters = new Array(this.splatters.length);
        for (let i = 0; i < this.splatters.length; i++) {
            splatters[i] = this.splatters[i].clone();
        }
        Object.assign(clone, {
            x: this.x,
            y: this.y,
            vy: this.vy,
            type: this.type,
            hardConnections: this.hardConnections,
            softConnections: this.softConnections,
            direction: this.direction,
            color: this.color,
            invisible: this.invisible,
            altar: this.altar,
            warp: this.warp,
            message: this.message,
            splatters: splatters,
        });
        return clone;
    }
}
