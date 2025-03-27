import Level from './level_engine.js';
export default class GameEngine {
    levelIndex;
    levelPrev;
    levelCurr;
    levelNext;
    levelData;
    constructor(levelData) {
        this.levelData = levelData;
        this.levelIndex = 1;
        this.levelPrev = new Level(this.levelData[this.levelIndex - 1]);
        this.levelCurr = new Level(this.levelData[this.levelIndex]);
        this.levelNext = new Level(this.levelData[this.levelIndex + 1]);
    }
    update() {
    }
}
