export default class RNG {
    private static A    = 1664525
    private static C    = 1013904223
    private static M    = Math.pow(2, 32)
    private seed        = 2817880113

    nextInt() {
        this.seed = (RNG.A * this.seed + RNG.C) % RNG.M
        return this.seed
    }
    nextFloat() {
        return this.nextInt() / RNG.M
    }
}