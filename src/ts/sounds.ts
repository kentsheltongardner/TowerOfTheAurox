export default class Sounds {
    static readonly Bell = <HTMLAudioElement>document.getElementById('bell')
    static readonly Whooshes: HTMLAudioElement[] = [
        <HTMLAudioElement>document.getElementById('whoosh-1'),
        <HTMLAudioElement>document.getElementById('whoosh-2'),
        <HTMLAudioElement>document.getElementById('whoosh-3'),
        <HTMLAudioElement>document.getElementById('whoosh-4'),
        <HTMLAudioElement>document.getElementById('whoosh-5'),
    ]
    static readonly Vanishes = [
        <HTMLAudioElement>document.getElementById('vanish-1'),
        <HTMLAudioElement>document.getElementById('vanish-2'),
    ]
    static readonly Booms = [
        <HTMLAudioElement>document.getElementById('boom-1'),
        <HTMLAudioElement>document.getElementById('boom-2'),
        <HTMLAudioElement>document.getElementById('boom-3'),
        <HTMLAudioElement>document.getElementById('boom-4'),
        <HTMLAudioElement>document.getElementById('boom-5'),
    ]
    static readonly Pops = [
        <HTMLAudioElement>document.getElementById('pop-1'),
        <HTMLAudioElement>document.getElementById('pop-2'),
        <HTMLAudioElement>document.getElementById('pop-3'),
        <HTMLAudioElement>document.getElementById('pop-4'),
        <HTMLAudioElement>document.getElementById('pop-5'),
    ]
    static readonly Splats = [
        <HTMLAudioElement>document.getElementById('splat-1'),
        <HTMLAudioElement>document.getElementById('splat-2'),
        <HTMLAudioElement>document.getElementById('splat-3'),
    ]
    static readonly Zaps = [
        <HTMLAudioElement>document.getElementById('zap-1'),
        <HTMLAudioElement>document.getElementById('zap-2'),
        <HTMLAudioElement>document.getElementById('zap-3'),
    ]
    static readonly Thumps = [
        <HTMLAudioElement>document.getElementById('thump-1'),
        <HTMLAudioElement>document.getElementById('thump-2'),
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
    static playZap() {
        Sounds.playRandom(Sounds.Zaps)
    }
}