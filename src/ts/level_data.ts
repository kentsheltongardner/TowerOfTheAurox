export default interface LevelData {
    title:          string,
    typeGrid:       string[]
    attributeGrid:  string[]
    walkerData:     [number, number, number][]
    creeperData:    [number, number, number][]
    torchData:      [number, number][]
    messages:       [string, number, number][]
    decorationData: [number, number, number][]
}