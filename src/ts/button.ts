export default class Button {
    public static readonly Width        = 15
    public static readonly Height       = 15
    public static readonly Gap          = 3
    public static readonly Padding      = 8

    public static readonly Previous     = 0
    public static readonly Reset        = 1
    public static readonly Undo         = 2
    public static readonly Pause        = 3
    public static readonly Fast         = 4
    public static readonly Next         = 5
    public static readonly Fullscreen   = 6
    public static readonly Mute         = 7

    public static readonly Count        = 8

    public static readonly HoverTextMap = [
        'Pre[V]ious level',
        '[R]eset level',
        '[U]ndo move',
        '[P]ause game',
        '[S]peed up',
        '[N]ext level',
        'Toggle [F]ullscreen',
        '[M]ute/unmute',
    ]

    public type:        number
    public x:           number
    public y:           number

    constructor(type: number, x: number, y: number) {
        this.type       = type
        this.x          = x
        this.y          = y
    }

    contains(x: number, y: number) {
        return x >= this.x && y >= this.y && x < this.x + Button.Width && y < this.y + Button.Height
    }
}