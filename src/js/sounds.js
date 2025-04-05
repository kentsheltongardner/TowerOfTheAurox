export default class Sounds {
    static Bell = new Audio('./res/sounds/bell.mp3');
    static Whooshes = [
        new Audio('./res/sounds/whoosh_1.wav'),
        new Audio('./res/sounds/whoosh_2.wav'),
        new Audio('./res/sounds/whoosh_3.wav'),
        new Audio('./res/sounds/whoosh_4.wav'),
        new Audio('./res/sounds/whoosh_5.wav')
    ];
    static Vanishes = [
        new Audio('./res/sounds/vanish_1.mp3'),
        new Audio('./res/sounds/vanish_2.mp3')
    ];
    static Booms = [
        new Audio('./res/sounds/boom_1.wav'),
        new Audio('./res/sounds/boom_2.wav'),
        new Audio('./res/sounds/boom_3.wav'),
        new Audio('./res/sounds/boom_4.wav'),
        new Audio('./res/sounds/boom_5.wav')
    ];
    static Pops = [
        new Audio('./res/sounds/pop_1.wav'),
        new Audio('./res/sounds/pop_2.wav'),
        new Audio('./res/sounds/pop_3.wav'),
        new Audio('./res/sounds/pop_4.wav'),
        new Audio('./res/sounds/pop_5.wav')
    ];
    static Splats = [
        new Audio('./res/sounds/splat_1.wav'),
        new Audio('./res/sounds/splat_2.wav'),
        new Audio('./res/sounds/splat_3.wav')
    ];
    static Splashes = [
        new Audio('./res/sounds/splash_1.wav'),
        new Audio('./res/sounds/splash_2.wav'),
        new Audio('./res/sounds/splash_3.wav')
    ];
    static Zaps = [
        new Audio('./res/sounds/zap_1.wav'),
        new Audio('./res/sounds/zap_2.wav'),
        new Audio('./res/sounds/zap_3.wav')
    ];
    static Thumps = [
        new Audio('./res/sounds/thump_1.wav'),
        new Audio('./res/sounds/thump_2.wav')
    ];
    static playRandom(sounds) {
        const index = Math.floor(Math.random() * sounds.length);
        const sound = sounds[index];
        sound.currentTime = 0;
        sound.play();
    }
    static playSingle(sound) {
        sound.currentTime = 0;
        sound.play();
    }
    static playBoom() {
        Sounds.playRandom(Sounds.Booms);
    }
    static playPop() {
        Sounds.playRandom(Sounds.Pops);
    }
    static playThump() {
        Sounds.playRandom(Sounds.Thumps);
    }
    static playVanish() {
        Sounds.playRandom(Sounds.Vanishes);
    }
    static playSplat() {
        Sounds.playRandom(Sounds.Splats);
    }
    static playBell() {
        Sounds.playSingle(Sounds.Bell);
    }
    static playWhoosh() {
        Sounds.playRandom(Sounds.Whooshes);
    }
    static playZap() {
        Sounds.playRandom(Sounds.Zaps);
    }
    static playSplash() {
        Sounds.playRandom(Sounds.Splashes);
    }
}
