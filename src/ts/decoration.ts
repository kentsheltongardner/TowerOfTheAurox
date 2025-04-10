export default class Decoration {
    static readonly BannerAurox     = 0
    static readonly BannerAuroxLong = 1

    static readonly Count = 1

    public type: number
    public x: number
    public y: number

    constructor(type: number, x: number, y: number) {
        this.type   = type
        this.x      = x
        this.y      = y
    }
}