import Emitter from "../classes/Emitter.js"

export default class Player extends Emitter {
  constructor(target, playing = false) {
    super()
    this.target = target ?? this
    this.target.playing = playing
  }

  end(...args) {
    this.stop(...args)
    this.emit("end", ...args)
  }

  play(...args) {
    this.target.playing = true
    this.emit("play", ...args)
  }

  stop(...args) {
    this.target.playing = false
    this.emit("stop", ...args)
  }

  pause(...args) {
    if (this.target.playing) {
      this.target.playing = false
      this.emit("pause", ...args)
    }
  }

  resume(...args) {
    if (!this.target.playing) {
      this.emit("resume", ...args)
      this.play(...args)
    }
  }

  playPause(...args) {
    if (this.target.playing) this.pause(...args)
    else this.resume(...args)
  }

  destroy(...args) {
    this.stop(...args)
    this.emit("destroy", this)
    this.off("*")
  }
}
