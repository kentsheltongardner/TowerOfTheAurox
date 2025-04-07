import Block from './block.js';
export default class Images {
    static WallTemplate = new Image();
    static ClayTemplate = new Image();
    static CrateTemplate = new Image();
    static BoxTemplate = new Image();
    static StrappingTemplate = new Image();
    static MagnetTemplate = new Image();
    static IceTemplate = new Image();
    static SelectionTemplate = new Image();
    static WallTileset = new Image();
    static ClayTileset = new Image();
    static CrateTileset = new Image();
    static BoxTileset = new Image();
    static StrappingTileset = new Image();
    static MagnetTileset = new Image();
    static IceTileset = new Image();
    static SelectionTileset = new Image();
    static WalkerRight = new Image();
    static WalkerLeft = new Image();
    static CreeperRight = new Image();
    static CreeperLeft = new Image();
    static Torch = new Image();
    static Aurox = new Image();
    static Bricks = new Image();
    static Portals = new Image();
    static Beams = new Image();
    static Title = new Image();
    static Font = new Image();
    static Cursor = new Image();
    static CursorClosed = new Image();
    static OffsetMap = new Array(256).fill(-1);
    static SoutheastMap = new Array(256).fill(-1);
    static SouthwestMap = new Array(256).fill(-1);
    static NorthwestMap = new Array(256).fill(-1);
    static NortheastMap = new Array(256).fill(-1);
    static BlockTilesetMap = new Array(Block.TypeCount);
    static {
        Images.WallTemplate.src = './res/images/wall_template.png';
        Images.ClayTemplate.src = './res/images/clay_template.png';
        Images.CrateTemplate.src = './res/images/crate_template.png';
        Images.BoxTemplate.src = './res/images/box_template.png';
        Images.StrappingTemplate.src = './res/images/strapping_template.png';
        Images.MagnetTemplate.src = './res/images/magnet_template.png';
        Images.IceTemplate.src = './res/images/ice_template.png';
        Images.SelectionTemplate.src = './res/images/selection_template.png';
        Images.WalkerRight.src = './res/images/walker_right.png';
        Images.WalkerLeft.src = './res/images/walker_left.png';
        Images.CreeperRight.src = './res/images/creeper_right.png';
        Images.CreeperLeft.src = './res/images/creeper_left.png';
        Images.Aurox.src = './res/images/aurox.png';
        Images.Bricks.src = './res/images/bricks.png';
        Images.Portals.src = './res/images/portals.png';
        Images.Beams.src = './res/images/beams.png';
        Images.Torch.src = './res/images/torch.png';
        Images.Title.src = './res/images/title.png';
        Images.Font.src = './res/images/small_font.png';
        Images.Cursor.src = './res/images/cursor.png';
        Images.CursorClosed.src = './res/images/cursor_closed.png';
        Images.initializeMaps();
    }
    static createTilesetImages() {
        Images.WallTileset = Images.tilesetImage(Images.WallTemplate);
        Images.ClayTileset = Images.tilesetImage(Images.ClayTemplate);
        Images.CrateTileset = Images.tilesetImage(Images.CrateTemplate);
        Images.BoxTileset = Images.tilesetImage(Images.BoxTemplate);
        Images.StrappingTileset = Images.tilesetImage(Images.StrappingTemplate);
        Images.MagnetTileset = Images.tilesetImage(Images.MagnetTemplate);
        Images.IceTileset = Images.tilesetImage(Images.IceTemplate);
        Images.SelectionTileset = Images.tilesetImage(Images.SelectionTemplate);
        Images.BlockTilesetMap[Block.Wall] = Images.WallTileset;
        Images.BlockTilesetMap[Block.Clay] = Images.ClayTileset;
        Images.BlockTilesetMap[Block.Crate] = Images.CrateTileset;
        Images.BlockTilesetMap[Block.Box] = Images.BoxTileset;
        Images.BlockTilesetMap[Block.Magnet] = Images.MagnetTileset;
        Images.BlockTilesetMap[Block.Ice] = Images.IceTileset;
    }
    // direction 
    static initializeMaps() {
        let index = 0;
        for (let i = 0; i < 256; i++) {
            const e = (i & 1) === 1;
            const s = (i & 2) >> 1 === 1;
            const w = (i & 4) >> 2 === 1;
            const n = (i & 8) >> 3 === 1;
            const se = (i & 16) >> 4 === 1;
            const sw = (i & 32) >> 5 === 1;
            const nw = (i & 64) >> 6 === 1;
            const ne = (i & 128) >> 7 === 1;
            const seIndex = Images.templateIndex(e, s, se);
            const swIndex = Images.templateIndex(w, s, sw);
            const nwIndex = Images.templateIndex(w, n, nw);
            const neIndex = Images.templateIndex(e, n, ne);
            if (seIndex === -1 || swIndex === -1 || nwIndex === -1 || neIndex === -1)
                continue;
            Images.OffsetMap[i] = index;
            Images.SoutheastMap[i] = seIndex;
            Images.SouthwestMap[i] = swIndex;
            Images.NorthwestMap[i] = nwIndex;
            Images.NortheastMap[i] = neIndex;
            index++;
        }
    }
    // Assumes a template with even dimensions
    static tilesetImage(template) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const width = Block.Width;
        const height = Block.Height;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        canvas.width = width * Images.OffsetMap.length;
        canvas.height = height;
        for (let i = 0; i < 256; i++) {
            const offset = Images.OffsetMap[i];
            if (offset === -1)
                continue;
            const srcXSE = Images.SoutheastMap[i] * width + halfWidth;
            const srcXSW = Images.SouthwestMap[i] * width;
            const srcXNW = Images.NorthwestMap[i] * width;
            const srcXNE = Images.NortheastMap[i] * width + halfWidth;
            context.drawImage(template, srcXSE, halfHeight, halfWidth, halfHeight, offset * width + halfWidth, halfHeight, halfWidth, halfHeight);
            context.drawImage(template, srcXSW, halfHeight, halfWidth, halfHeight, offset * width, halfHeight, halfWidth, halfHeight);
            context.drawImage(template, srcXNW, 0, halfWidth, halfHeight, offset * width, 0, halfWidth, halfHeight);
            context.drawImage(template, srcXNE, 0, halfWidth, halfHeight, offset * width + halfWidth, 0, halfWidth, halfHeight);
        }
        const tileset = new Image();
        tileset.src = canvas.toDataURL();
        return tileset;
    }
    static templateIndex(horizontal, vertical, diagonal) {
        const horizontalAndVertical = horizontal && vertical;
        if (diagonal)
            return horizontalAndVertical ? 0 : -1;
        if (horizontalAndVertical)
            return 1;
        if (horizontal)
            return 2;
        if (vertical)
            return 3;
        return 4;
    }
}
