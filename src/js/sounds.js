export default class Sounds {
    static Bell = document.getElementById('bell');
    static Whooshes = [
        document.getElementById('whoosh-1'),
        document.getElementById('whoosh-2'),
        document.getElementById('whoosh-3'),
        document.getElementById('whoosh-4'),
        document.getElementById('whoosh-5'),
    ];
    static Vanishes = [
        document.getElementById('vanish-1'),
        document.getElementById('vanish-2'),
    ];
    static Booms = [
        document.getElementById('boom-1'),
        document.getElementById('boom-2'),
        document.getElementById('boom-3'),
        document.getElementById('boom-4'),
        document.getElementById('boom-5'),
    ];
    static Pops = [
        document.getElementById('pop-1'),
        document.getElementById('pop-2'),
        document.getElementById('pop-3'),
        document.getElementById('pop-4'),
        document.getElementById('pop-5'),
    ];
    static Splats = [
        document.getElementById('splat-1'),
        document.getElementById('splat-2'),
        document.getElementById('splat-3'),
    ];
    static Zaps = [
        document.getElementById('zap-1'),
        document.getElementById('zap-2'),
        document.getElementById('zap-3'),
    ];
    static Thumps = [
        document.getElementById('thump-1'),
        document.getElementById('thump-2'),
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
}
