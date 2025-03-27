import Vec2 from './vec2.js'

export default class Connection {
    public static readonly None                     = -1
    public static readonly Soft                     = 0
    public static readonly Hard                     = 1

    public static readonly East                     = 0
    public static readonly South                    = 1
    public static readonly West                     = 2
    public static readonly North                    = 3
    public static readonly Southeast                = 4
    public static readonly Southwest                = 5
    public static readonly Northwest                = 6
    public static readonly Northeast                = 7

    public static readonly CardinalDirectionCount   = 4
    public static readonly DirectionCount           = 8

    public static DirectionBits = [
        0b00000001,
        0b00000010,
        0b00000100,
        0b00001000,
        0b00010000,
        0b00100000,
        0b01000000,
        0b10000000,
    ]

    public static readonly CharToDirection: Record<string, number> = {
        '>': Connection.East,
        'v': Connection.South,
        '<': Connection.West,
        '^': Connection.North
    }

    public static OppositeDirections = [ 
        Connection.West, 
        Connection.North, 
        Connection.East, 
        Connection.South, 
        Connection.Northwest, 
        Connection.Northeast, 
        Connection.Southeast, 
        Connection.Southwest 
    ]

    public static DirectionVectors = [ 
        new Vec2(1, 0), 
        new Vec2(0, 1), 
        new Vec2(-1, 0), 
        new Vec2(0, -1), 
        new Vec2(1, 1), 
        new Vec2(-1, 1), 
        new Vec2(-1, -1), 
        new Vec2(1, -1), 
    ]

    public static readonly CharToConnection: Record<string, number> = {
        ' ': Connection.None,
        '-': Connection.Soft,
        '=': Connection.Hard,
    }
}