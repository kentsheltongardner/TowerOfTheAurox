import Vec2 from './vec2.js';
export default class Connection {
    static None = -1;
    static Soft = 0;
    static Hard = 1;
    static East = 0;
    static South = 1;
    static West = 2;
    static North = 3;
    static Southeast = 4;
    static Southwest = 5;
    static Northwest = 6;
    static Northeast = 7;
    static CardinalDirectionCount = 4;
    static DirectionCount = 8;
    static DirectionBits = [
        0b00000001,
        0b00000010,
        0b00000100,
        0b00001000,
        0b00010000,
        0b00100000,
        0b01000000,
        0b10000000,
    ];
    static CharToDirection = {
        '>': Connection.East,
        'v': Connection.South,
        '<': Connection.West,
        '^': Connection.North
    };
    static OppositeDirections = [
        Connection.West,
        Connection.North,
        Connection.East,
        Connection.South,
        Connection.Northwest,
        Connection.Northeast,
        Connection.Southeast,
        Connection.Southwest
    ];
    static DirectionVectors = [
        new Vec2(1, 0),
        new Vec2(0, 1),
        new Vec2(-1, 0),
        new Vec2(0, -1),
        new Vec2(1, 1),
        new Vec2(-1, 1),
        new Vec2(-1, -1),
        new Vec2(1, -1),
    ];
    static CharToConnection = {
        ' ': Connection.None,
        '-': Connection.Soft,
        '=': Connection.Hard,
    };
}
