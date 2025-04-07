import Block from './block.js'

export default class Images {
    public static WallTemplate      = new Image()
    public static ClayTemplate      = new Image()
    public static CrateTemplate     = new Image()
    public static BoxTemplate       = new Image()
    public static StrappingTemplate = new Image()
    public static MagnetTemplate    = new Image()
    public static IceTemplate       = new Image()
    public static SelectionTemplate = new Image()

    public static WallTileset       = new Image()
    public static ClayTileset       = new Image()
    public static CrateTileset      = new Image()
    public static BoxTileset        = new Image()
    public static StrappingTileset  = new Image()
    public static MagnetTileset     = new Image()
    public static IceTileset        = new Image()
    public static SelectionTileset  = new Image()

    public static WalkerRight       = new Image()
    public static WalkerLeft        = new Image()

    public static CreeperRight      = new Image()
    public static CreeperLeft       = new Image()

    public static Torch             = new Image()

    public static Aurox             = new Image()
    public static Bricks            = new Image()
    public static Portals           = new Image()
    public static Beams             = new Image()

    public static Title             = new Image()
    public static Font              = new Image()
    public static Cursor            = new Image()
    public static CursorClosed      = new Image()

    public static OffsetMap         = new Array(256).fill(-1)
    public static SoutheastMap      = new Array(256).fill(-1)
    public static SouthwestMap      = new Array(256).fill(-1)
    public static NorthwestMap      = new Array(256).fill(-1)
    public static NortheastMap      = new Array(256).fill(-1)
    public static BlockTilesetMap   = new Array(Block.TypeCount)

    static {
        Images.WallTemplate.src         = './res/images/wall_template.png'
        Images.ClayTemplate.src         = './res/images/clay_template.png'
        Images.CrateTemplate.src        = './res/images/crate_template.png'
        Images.BoxTemplate.src          = './res/images/box_template.png'
        Images.StrappingTemplate.src    = './res/images/strapping_template.png'
        Images.MagnetTemplate.src       = './res/images/magnet_template.png'
        Images.IceTemplate.src          = './res/images/ice_template.png'
        Images.SelectionTemplate.src     = './res/images/selection_template.png'

        Images.WalkerRight.src          = './res/images/walker_right.png'
        Images.WalkerLeft.src           = './res/images/walker_left.png'

        Images.CreeperRight.src         = './res/images/creeper_right.png'
        Images.CreeperLeft.src          = './res/images/creeper_left.png'

        Images.Aurox.src                = './res/images/aurox.png'
        Images.Bricks.src               = './res/images/bricks.png'
        Images.Portals.src              = './res/images/portals.png'
        Images.Beams.src                = './res/images/beams.png'

        Images.Torch.src                = './res/images/torch.png'

        Images.Title.src                = './res/images/title.png'
        Images.Font.src                 = './res/images/small_font.png'
        Images.Cursor.src               = './res/images/cursor.png'
        Images.CursorClosed.src         = './res/images/cursor_closed.png'

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