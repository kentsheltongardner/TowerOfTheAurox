export default class Button {
    public static readonly Width        = 15
    public static readonly Height       = 15
    public static readonly Gap          = 3
    public static readonly Y            = 3

    public static readonly Previous     = 0
    public static readonly Reset        = 1
    public static readonly Undo         = 2
    public static readonly Pause        = 3
    public static readonly Fast         = 4
    public static readonly Next         = 5

    public static readonly Count        = 6

    public static readonly HoverTextMap = [
        'Pre[v]ious',
        '[R]eset',
        '[U]ndo',
        '[P]ause',
        '[F]ast',
        '[N]ext',
    ]

    public type:        number
    public x:           number
    public y:           number

    constructor(type: number, x: number, y: number) {
        this.type       = type
        this.x          = x
        this.y          = y
    }
}