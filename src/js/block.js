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
    static Goal = 4;
    static Magnet = 5;
    static Portal = 6;
    static Beam = 7;
    static Mirror = 8;
    static TypeCount = 9;
    static CharToType = {
        '.': Block.None,
        '#': Block.Wall,
        '*': Block.Clay,
        '$': Block.Crate,
        '%': Block.Box,
        '@': Block.Goal,
        '+': Block.Magnet,
        '&': Block.Portal,
        '!': Block.Beam,
        '^': Block.Mirror,
    };
    static TypeIsDestructible = [
        false,
        true,
        false,
        true,
        false,
        false,
        false,
        false,
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
        true,
    ];
    type;
    hardConnections = 0;
    softConnections = 0;
    direction = Connection.None;
    color = Color.None;
    ethereal = false;
    invisible = false;
    splatters = [];
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
    }
    setAttribute(char) {
        if (char in Color.CharToColor) {
            this.color = Color.CharToColor[char];
            return;
        }
        if (char in Connection.CharToDirection) {
            this.direction = Connection.CharToDirection[char];
            return;
        }
        switch (char) {
            case 'E': {
                this.ethereal = true;
                break;
            }
            case 'I': {
                this.invisible = true;
                break;
            }
        }
    }
}
