import { testLevels }   from './levels.js'
import Images           from './images.js'
import Game             from './game.js'
import RNG              from './rng.js'

window.addEventListener('load', () => {
    Images.createTilesetImages()
    const canvas = <HTMLCanvasElement>document.getElementById('game-canvas')
    new Game(testLevels, canvas)
})