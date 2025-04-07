export default class RNG {
    private static readonly A = 75
    private static readonly C = 74
    private static readonly M = 65521
    private seed: number;
  
    constructor(seed: number = 0) {
      this.seed = seed % RNG.M
    }
  
    nextInt(): number {
      this.seed = (RNG.A * this.seed + RNG.C) % RNG.M
      return this.seed
    }
  
    nextFloat(): number {
      return this.nextInt() / RNG.M
    }
}