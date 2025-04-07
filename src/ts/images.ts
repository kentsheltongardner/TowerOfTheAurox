import Block from './block.js'

export default class Images {
    public static WallTemplate: HTMLImageElement        = <HTMLImageElement>document.getElementById('wall-template')
    public static ClayTemplate: HTMLImageElement        = <HTMLImageElement>document.getElementById('clay-template')
    public static CrateTemplate: HTMLImageElement       = <HTMLImageElement>document.getElementById('crate-template')
    public static BoxTemplate: HTMLImageElement         = <HTMLImageElement>document.getElementById('box-template')
    public static StrappingTemplate: HTMLImageElement   = <HTMLImageElement>document.getElementById('strapping-template')
    public static MagnetTemplate: HTMLImageElement      = <HTMLImageElement>document.getElementById('magnet-template')
    public static IceTemplate: HTMLImageElement         = <HTMLImageElement>document.getElementById('ice-template')
    public static SelectionTemplate: HTMLImageElement   = <HTMLImageElement>document.getElementById('selection-template')

    public static WallTileset       = new Image()
    public static ClayTileset       = new Image()
    public static CrateTileset      = new Image()
    public static BoxTileset        = new Image()
    public static StrappingTileset  = new Image()
    public static MagnetTileset     = new Image()
    public static IceTileset        = new Image()
    public static SelectionTileset  = new Image()

    public static WalkerRight       = <HTMLImageElement>document.getElementById('walker-right')
    public static WalkerLeft        = <HTMLImageElement>document.getElementById('walker-left')
    public static CreeperRight      = <HTMLImageElement>document.getElementById('creeper-right')
    public static CreeperLeft       = <HTMLImageElement>document.getElementById('creeper-left')
    public static Torch             = <HTMLImageElement>document.getElementById('torch')
    public static Aurox             = <HTMLImageElement>document.getElementById('aurox')
    public static Bricks            = <HTMLImageElement>document.getElementById('bricks')
    public static Beams             = <HTMLImageElement>document.getElementById('beams')
    public static Title             = <HTMLImageElement>document.getElementById('title')
    public static Font              = <HTMLImageElement>document.getElementById('font')
    public static Cursor            = <HTMLImageElement>document.getElementById('cursor')
    public static CursorClosed      = <HTMLImageElement>document.getElementById('cursor-closed')

    public static OffsetMap         = new Array(256).fill(-1)
    public static SoutheastMap      = new Array(256).fill(-1)
    public static SouthwestMap      = new Array(256).fill(-1)
    public static NorthwestMap      = new Array(256).fill(-1)
    public static NortheastMap      = new Array(256).fill(-1)
    public static BlockTilesetMap   = new Array(Block.TypeCount)

    static {
        Images.initializeMaps()
    }

    static createTilesetImages() {
        Images.WallTileset      = Images.tilesetImage(Images.WallTemplate)
        Images.ClayTileset      = Images.tilesetImage(Images.ClayTemplate)
        Images.CrateTileset     = Images.tilesetImage(Images.CrateTemplate)
        Images.BoxTileset       = Images.tilesetImage(Images.BoxTemplate)
        Images.StrappingTileset = Images.tilesetImage(Images.StrappingTemplate)
        Images.MagnetTileset    = Images.tilesetImage(Images.MagnetTemplate)
        Images.IceTileset       = Images.tilesetImage(Images.IceTemplate)
        Images.SelectionTileset = Images.tilesetImage(Images.SelectionTemplate)

        Images.BlockTilesetMap[Block.Wall]      = Images.WallTileset
        Images.BlockTilesetMap[Block.Clay]      = Images.ClayTileset
        Images.BlockTilesetMap[Block.Crate]     = Images.CrateTileset
        Images.BlockTilesetMap[Block.Box]       = Images.BoxTileset
        Images.BlockTilesetMap[Block.Magnet]    = Images.MagnetTileset
        Images.BlockTilesetMap[Block.Ice]       = Images.IceTileset
    }

    // direction 
    static initializeMaps() {
        let index = 0
        for (let i = 0; i < 256; i++) {
            const e     = (i & 1)         === 1
            const s     = (i & 2) >> 1    === 1
            const w     = (i & 4) >> 2    === 1
            const n     = (i & 8) >> 3    === 1
            const se    = (i & 16) >> 4   === 1
            const sw    = (i & 32) >> 5   === 1
            const nw    = (i & 64) >> 6   === 1
            const ne    = (i & 128) >> 7  === 1

            const seIndex: number = Images.templateIndex(e, s, se)
            const swIndex: number = Images.templateIndex(w, s, sw)
            const nwIndex: number = Images.templateIndex(w, n, nw)
            const neIndex: number = Images.templateIndex(e, n, ne)

            if (seIndex === -1 || swIndex === -1 || nwIndex === -1 || neIndex === -1) continue

            Images.OffsetMap[i]     = index
            Images.SoutheastMap[i]  = seIndex
            Images.SouthwestMap[i]  = swIndex
            Images.NorthwestMap[i]  = nwIndex
            Images.NortheastMap[i]  = neIndex

            index++
        }
    }

    // Assumes a template with even dimensions
    static tilesetImage(template: HTMLImageElement): HTMLImageElement {
        const canvas        = document.createElement('canvas')
        const context       = canvas.getContext('2d')!
        const width         = Block.Width
        const height        = Block.Height
        const halfWidth     = width / 2
        const halfHeight    = height / 2
        canvas.width        = width * Images.OffsetMap.length
        canvas.height       = height

        for (let i = 0; i < 256; i++) {
            const offset = Images.OffsetMap[i]
            if (offset === -1) continue

            const srcXSE = Images.SoutheastMap[i] * width + halfWidth
            const srcXSW = Images.SouthwestMap[i] * width
            const srcXNW = Images.NorthwestMap[i] * width
            const srcXNE = Images.NortheastMap[i] * width + halfWidth

            context.drawImage(template, srcXSE, halfHeight, halfWidth, halfHeight, offset * width + halfWidth,   halfHeight, halfWidth, halfHeight)
            context.drawImage(template, srcXSW, halfHeight, halfWidth, halfHeight, offset * width,               halfHeight, halfWidth, halfHeight)
            context.drawImage(template, srcXNW, 0,          halfWidth, halfHeight, offset * width,               0,          halfWidth, halfHeight)
            context.drawImage(template, srcXNE, 0,          halfWidth, halfHeight, offset * width + halfWidth,   0,          halfWidth, halfHeight)
        }

        const tileset = new Image()
        tileset.src = canvas.toDataURL()
        return tileset
    }

    static templateIndex(horizontal: boolean, vertical: boolean, diagonal: boolean): number {
        const horizontalAndVertical = horizontal && vertical
        if (diagonal)               return horizontalAndVertical ? 0 : -1
        if (horizontalAndVertical)  return 1
        if (horizontal)             return 2
        if (vertical)               return 3
                                    return 4
    }
}