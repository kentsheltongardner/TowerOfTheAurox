export default class RNG {
    static A = 1664525;
    static C = 1013904223;
    static M = Math.pow(2, 32);
    seed = 2817880113;
    nextInt() {
        this.seed = (RNG.A * this.seed + RNG.C) % RNG.M;
        return this.seed;
    }
    nextFloat() {
        return this.nextInt() / RNG.M;
    }
}
