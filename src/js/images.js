import Block from './block.js';
export default class Images {
    static WallTemplate = document.getElementById('wall-template');
    static ClayTemplate = document.getElementById('clay-template');
    static CrateTemplate = document.getElementById('crate-template');
    static BoxTemplate = document.getElementById('box-template');
    static StrappingTemplate = document.getElementById('strapping-template');
    static MagnetTemplate = document.getElementById('magnet-template');
    static IceTemplate = document.getElementById('ice-template');
    static SelectionTemplate = document.getElementById('selection-template');
    static WallTileset = new Image();
    static ClayTileset = new Image();
    static CrateTileset = new Image();
    static BoxTileset = new Image();
    static StrappingTileset = new Image();
    static MagnetTileset = new Image();
    static IceTileset = new Image();
    static SelectionTileset = new Image();
    static WalkerRight = document.getElementById('walker-right');
    static WalkerLeft = document.getElementById('walker-left');
    static CreeperRight = document.getElementById('creeper-right');
    static CreeperLeft = document.getElementById('creeper-left');
    static Torch = document.getElementById('torch');
    static Aurox = document.getElementById('aurox');
    static Bricks = document.getElementById('bricks');
    static Beams = document.getElementById('beams');
    static Title = document.getElementById('title');
    static Font = document.getElementById('font');
    static Cursor = document.getElementById('cursor');
    static CursorClosed = document.getElementById('cursor-closed');
    static OffsetMap = new Array(256).fill(-1);
    static SoutheastMap = new Array(256).fill(-1);
    static SouthwestMap = new Array(256).fill(-1);
    static NorthwestMap = new Array(256).fill(-1);
    static NortheastMap = new Array(256).fill(-1);
    static BlockTilesetMap = new Array(Block.TypeCount);
    static {
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
        const frames = template.height / height;
        canvas.width = width * Images.OffsetMap.length;
        canvas.height = template.height;
        for (let i = 0; i < 256; i++) {
            for (let j = 0; j < frames; j++) {
                const offset = Images.OffsetMap[i];
                if (offset === -1)
                    continue;
                const y = j * height;
                const srcXSE = Images.SoutheastMap[i] * width + halfWidth;
                const srcXSW = Images.SouthwestMap[i] * width;
                const srcXNW = Images.NorthwestMap[i] * width;
                const srcXNE = Images.NortheastMap[i] * width + halfWidth;
                context.drawImage(template, srcXSE, y + halfHeight, halfWidth, halfHeight, offset * width + halfWidth, y + halfHeight, halfWidth, halfHeight);
                context.drawImage(template, srcXSW, y + halfHeight, halfWidth, halfHeight, offset * width, y + halfHeight, halfWidth, halfHeight);
                context.drawImage(template, srcXNW, y, halfWidth, halfHeight, offset * width, y, halfWidth, halfHeight);
                context.drawImage(template, srcXNE, y, halfWidth, halfHeight, offset * width + halfWidth, y, halfWidth, halfHeight);
            }
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
