export default class Color {
    static readonly None    = -1
    static readonly Red     = 0
    static readonly Orange  = 1
    static readonly Yellow  = 2
    static readonly Green   = 3
    static readonly Cyan    = 4
    static readonly Blue    = 5
    static readonly Purple  = 6
    static readonly Magenta = 7

    static readonly CharToColor: Record<string, number> = {
        'R': Color.Red,
        'O': Color.Orange,
        'Y': Color.Yellow,
        'G': Color.Green,
        'C': Color.Cyan,
        'B': Color.Blue,
        'P': Color.Purple,
        'M': Color.Magenta,
    }
}