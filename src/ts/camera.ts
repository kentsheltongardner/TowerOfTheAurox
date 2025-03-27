export default class Camera {
    static readonly ShakeReduce = 0.9

    public shakeIntensity: number

    constructor() {
        this.shakeIntensity = 0
    }

    shake(intensity: number) {
        this.shakeIntensity += intensity
    }

    update() {
        this.shakeIntensity *= Camera.ShakeReduce
    }
}