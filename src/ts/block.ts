import Splatter from './splatter.js'
import Faller from './faller.js'
import Connection from './connection.js'
import Color from './color.js'

export default class Block extends Faller {
    static readonly Width       = 20
    static readonly Height      = 30

    static readonly None        = -1
    static readonly Wall        = 0
    static readonly Clay        = 1
    static readonly Crate       = 2
    static readonly Box         = 3
    static readonly Magnet      = 4
    static readonly Beam        = 5
    static readonly Ice         = 6

    static readonly TypeCount   = 7

    static readonly CharToType: Record<string, number> = {
        '.': Block.None,
        '#': Block.Wall,
        '*': Block.Clay,
        '$': Block.Crate,
        '%': Block.Box,
        '+': Block.Magnet,
        '!': Block.Beam,
        '@': Block.Ice,
    }

    static readonly TypeIsDestructible = [
        false, 
        true, 
        false, 
        true, 
        false,
        false,
        true,
    ]

    static readonly TypeFalls = [
        false, 
        false, 
        true, 
        true, 
        true,
        true,
        true,
    ]

    public type:            number
    public hardConnections: number      = 0
    public softConnections: number      = 0
    public direction:       number      = Connection.None
    public color:           number      = Color.None
    public invisible:       boolean     = false
    public altar:           boolean     = false
    public warp:            boolean     = false
    public splatters:       Splatter[]  = []
    public primed:          boolean     = false
    public activated:       boolean     = false

    constructor(x: number, y: number, type: number) {
        super(x, y)
        this.type = type
    }

    setAttribute(char: string) {
        if (char in Color.CharToColor) {
            this.color = Color.CharToColor[char]
            this.warp = true
            return
        }
        if (char in Connection.CharToDirection) {
            this.direction = Connection.CharToDirection[char]
            return
        }
        switch (char) {
            case 'I': {
                this.invisible = true
                break
            }
            case 'A': {
                this.altar  = true
                break
            }
        }
    }
}