export default class Button {
    static Width = 15;
    static Height = 15;
    static Gap = 3;
    static Padding = 8;
    static Previous = 0;
    static Reset = 1;
    static Undo = 2;
    static Pause = 3;
    static Fast = 4;
    static Next = 5;
    static Fullscreen = 6;
    static Mute = 7;
    static Count = 8;
    static HoverTextMap = [
        'Pre[V]ious level',
        '[R]eset level',
        '[U]ndo move',
        '[P]ause game',
        '[S]peed up',
        '[N]ext level',
        'Toggle [F]ullscreen',
        '[M]ute/unmute',
    ];
    type;
    x;
    y;
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
    }
    contains(x, y) {
        return x >= this.x && y >= this.y && x < this.x + Button.Width && y < this.y + Button.Height;
    }
}
