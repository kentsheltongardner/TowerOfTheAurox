export default class Button {
    static Width = 15;
    static Height = 15;
    static Gap = 3;
    static Y = 3;
    static Previous = 0;
    static Reset = 1;
    static Undo = 2;
    static Pause = 3;
    static Fast = 4;
    static Next = 5;
    static Count = 6;
    static HoverTextMap = [
        'Pre[v]ious',
        '[R]eset',
        '[U]ndo',
        '[P]ause',
        '[F]ast',
        '[N]ext',
    ];
    type;
    x;
    y;
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
    }
}
