import { testLevels } from './levels.js';
import Images from './images.js';
import Game from './game.js';
window.addEventListener('load', () => {
    Images.createTilesetImages();
    const canvas = document.getElementById('game-canvas');
    new Game(testLevels, canvas);
});
