export default class RNG {
    private static readonly A = 57797
    private static readonly C = 49151
    private static readonly M = 65536
    private seed: number
  
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

    static cycleLength() {
      length = 1
      const rng = new RNG()
      while (rng.nextInt() !== 0) {
        console.log(rng.seed)
        length++
      }
      return length
    }
}