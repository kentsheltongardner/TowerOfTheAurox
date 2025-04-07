export default class RNG {
    static A = 75;
    static C = 74;
    static M = 65521;
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
}
