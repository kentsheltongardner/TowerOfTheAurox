export default class Color {
    static None = -1;
    static Red = 0;
    static Orange = 1;
    static Yellow = 2;
    static Green = 3;
    static Cyan = 4;
    static Blue = 5;
    static Purple = 6;
    static Magenta = 7;
    static CharToColor = {
        'R': Color.Red,
        'O': Color.Orange,
        'Y': Color.Yellow,
        'G': Color.Green,
        'C': Color.Cyan,
        'B': Color.Blue,
        'P': Color.Purple,
        'M': Color.Magenta,
    };
    // static rValues = [255,  255,    255,    0,      0,      0,      128,    255]
    // static gValues = [0,    128,    255,    255,    255,    0,      0,      0]
    // static bValues = [0,    0,      0,      0,      255,    255,    255,    255]
    static rValues = [179, 179, 179, 83, 25, 25, 98, 179];
    static gValues = [33, 85, 161, 179, 179, 72, 25, 25];
    static bValues = [25, 25, 25, 25, 141, 179, 179, 161];
    static colorWithAlpha(color, alpha) {
        return this.cssColor(Color.rValues[color], Color.gValues[color], Color.bValues[color], alpha);
    }
    static cssColor(r, g, b, a) {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
}
