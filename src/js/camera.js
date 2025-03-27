export default class Camera {
    static ShakeReduce = 0.9;
    shakeIntensity;
    constructor() {
        this.shakeIntensity = 0;
    }
    shake(intensity) {
        this.shakeIntensity += intensity;
    }
    update() {
        this.shakeIntensity *= Camera.ShakeReduce;
    }
}
