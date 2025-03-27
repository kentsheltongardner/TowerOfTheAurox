export default class Sounds {
    static readonly Bell = new Audio('./res/sounds/bell.mp3')
    static readonly Whooshes = [
        new Audio('./res/sounds/whoosh_1.wav'),
        new Audio('./res/sounds/whoosh_2.wav'),
        new Audio('./res/sounds/whoosh_3.wav'),
        new Audio('./res/sounds/whoosh_4.wav'),
        new Audio('./res/sounds/whoosh_5.wav')
    ]
    static readonly Vanishes = [
        new Audio('./res/sounds/vanish_1.mp3'),
        new Audio('./res/sounds/vanish_2.mp3')
    ]
    static readonly Booms = [
        new Audio('./res/sounds/boom_1.wav'),
        new Audio('./res/sounds/boom_2.wav'),
        new Audio('./res/sounds/boom_3.wav'),
        new Audio('./res/sounds/boom_4.wav'),
        new Audio('./res/sounds/boom_5.wav')
    ]
    static readonly Pops = [
        new Audio('./res/sounds/pop_1.wav'),
        new Audio('./res/sounds/pop_2.wav'),
        new Audio('./res/sounds/pop_3.wav'),
        new Audio('./res/sounds/pop_4.wav'),
        new Audio('./res/sounds/pop_5.wav')
    ]
    static readonly Splats = [
        new Audio('./res/sounds/splat_1.wav'),
        new Audio('./res/sounds/splat_2.wav'),
        new Audio('./res/sounds/splat_3.wav')
    ]
    static readonly Thumps = [
        new Audio('./res/sounds/thump_1.wav'),
        new Audio('./res/sounds/thump_2.wav')
    ]
    static playRandom(sounds: HTMLAudioElement[]) {
        const index = Math.floor(Math.random() * sounds.length)
        const sound = sounds[index]
        sound.currentTime = 0
        sound.play()
    }
    static playSingle(sound: HTMLAudioElement) {
        sound.currentTime = 0
        sound.play()
    }
    static playBoom() {
        Sounds.playRandom(Sounds.Booms)
    }
    static playPop() {
        Sounds.playRandom(Sounds.Pops)
    }
    static playThump() {
        Sounds.playRandom(Sounds.Thumps)
    }
    static playVanish() {
        Sounds.playRandom(Sounds.Vanishes)
    }
    static playSplat() {
        Sounds.playRandom(Sounds.Splats)
    }
    static playBell() {
        Sounds.playSingle(Sounds.Bell)
    }
    static playWhoosh() {
        Sounds.playRandom(Sounds.Whooshes)
    }
}