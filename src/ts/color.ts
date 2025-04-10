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

    // static rValues = [255,  255,    255,    0,      0,      0,      128,    255]
    // static gValues = [0,    128,    255,    255,    255,    0,      0,      0]
    // static bValues = [0,    0,      0,      0,      255,    255,    255,    255]

    static rValues = [179,  179,    179,    83,     25,     25,     98,     179]
    static gValues = [33,   85,     161,    179,    179,    72,     25,     25]
    static bValues = [25,   25,     25,     25,     141,    179,    179,    161]

    static colorWithAlpha(color: number, alpha: number) {
        return this.cssColor(Color.rValues[color], Color.gValues[color], Color.bValues[color], alpha)
    }

    static cssColor(r: number, g: number, b: number, a: number) {
        return `rgba(${r}, ${g}, ${b}, ${a})`
    }
}