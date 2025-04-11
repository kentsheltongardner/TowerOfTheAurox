export default class RNG {
    static A = 57797;
    static C = 49151;
    static M = 65536;
    seed;
    constructor(seed = 0) {
        this.seed = seed % RNG.M;
    }
    nextInt() {
        this.seed = (RNG.A * this.seed + RNG.C) % RNG.M;
        return this.seed;
    }
    nextFloat() {
        return this.nextInt() / RNG.M;
    }
    static cycleLength() {
        length = 1;
        const rng = new RNG();
        while (rng.nextInt() !== 0) {
            console.log(rng.seed);
            length++;
        }
        return length;
    }
}
