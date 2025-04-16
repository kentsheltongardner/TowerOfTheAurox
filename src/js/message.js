export default class Message {
    static TargetFPS = 60;
    static FrameTimeMilliseconds = 1000 / Message.TargetFPS;
    static FadeInTimeMilliseconds = 125;
    static FadeInFrames = Math.floor(Message.FadeInTimeMilliseconds / Message.FrameTimeMilliseconds);
    static FadeOutTimeMilliseconds = 250;
    static FadeOutFrames = Math.floor(Message.FadeOutTimeMilliseconds / Message.FrameTimeMilliseconds);
    static StateFadeIn = 0;
    static StatePresent = 1;
    static StateFadeOut = 2;
    static StateGone = 3;
    state;
    frame = 0;
    text;
    constructor(text, state = Message.StateFadeIn) {
        this.state = state;
        this.text = text;
    }
    tap() {
        if (this.state === Message.StatePresent) {
            this.state = Message.StateFadeOut;
            this.frame = 0;
        }
    }
    update() {
        switch (this.state) {
            case Message.StateFadeIn:
                this.frame++;
                if (this.frame === Message.FadeInFrames) {
                    this.state = Message.StatePresent;
                }
                break;
            case Message.StatePresent:
                break;
            case Message.StateFadeOut:
                this.frame++;
                if (this.frame === Message.FadeOutFrames) {
                    this.state = Message.StateGone;
                }
                break;
            case Message.StateGone:
                break;
        }
    }
}
