import Emitter from "../class/Emitter.js"

export class Player extends Emitter {
  constructor(target) {
    super()
    this.target = target ?? this
  }

  cancel() {
    console.warn("Player.cancel() not implemented")
  }

  start() {
    console.warn("Player.start() not implemented")
  }

  end() {
    this.stop()
    this.emit("end", this)
    return this
  }

  play(...args) {
    this.emit("play", this)
    this.target.playing = true
    this.start(...args)
    return this
  }

  stop() {
    this.target.playing = false
    this.cancel()
    this.emit("stop", this)
    return this
  }

  pause() {
    if (this.target.playing) {
      this.target.playing = false
      this.cancel()
      this.emit("pause", this)
    }

    return this
  }

  resume() {
    if (!this.target.playing) {
      this.emit("resume", this)
      this.play()
    }

    return this
  }

  playPause() {
    if (this.target.playing) this.pause()
    else this.resume()
    return this
  }

  destroy() {
    this.stop()
    this.emit("destroy", this)
    this.off("*")
    return this
  }
}

export default function playable(item) {
  if (!item) return new Player()

  for (const key of Object.getOwnPropertyNames(Player.prototype)) {
    if (key !== "constructor" && key in item === false) {
      Object.defineProperty(item, key, { value: Player.prototype[key] })
    }
  }

  return item
}
