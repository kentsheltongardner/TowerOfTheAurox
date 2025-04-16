export default class Message {
    public static readonly TargetFPS                = 60
    public static readonly FrameTimeMilliseconds    = 1000 / Message.TargetFPS
    public static readonly FadeInTimeMilliseconds   = 125
    public static readonly FadeInFrames             = Math.floor(Message.FadeInTimeMilliseconds / Message.FrameTimeMilliseconds)
    public static readonly FadeOutTimeMilliseconds  = 250
    public static readonly FadeOutFrames            = Math.floor(Message.FadeOutTimeMilliseconds / Message.FrameTimeMilliseconds)

    public static readonly StateFadeIn              = 0
    public static readonly StatePresent             = 1
    public static readonly StateFadeOut             = 2
    public static readonly StateGone                = 3

    public state:   number
    public frame:   number  = 0
    public text:    string
    constructor(text: string, state: number = Message.StateFadeIn) {
        this.state  = state
        this.text   = text
    }

    tap() {
        if (this.state === Message.StatePresent) {
            this.state = Message.StateFadeOut
            this.frame = 0
        }
    }

    update() {
        switch (this.state) {
            case Message.StateFadeIn:
                this.frame++
                if (this.frame === Message.FadeInFrames) {
                    this.state = Message.StatePresent
                }
            break
            case Message.StatePresent:

            break
            case Message.StateFadeOut:
                this.frame++
                if (this.frame === Message.FadeOutFrames) {
                    this.state = Message.StateGone
                }
            break
            case Message.StateGone:

            break
        }
    }
}