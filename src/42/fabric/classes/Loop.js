// @thanks https://github.com/sethvincent/gameloop/blob/master/index.js
// @read https://dev.to/lukeshiru/comment/1e884

import Player from "./Player.js"
import noop from "../type/function/noop.js"

export default class Loop extends Player {
  constructor(update = noop, { fps, speed = 1 } = {}) {
    super()
    this.update = update
    this.speed = speed
    this.fps = fps
    this.step = 1000 / (this.fps ?? 60)

    this.loop = this.fps
      ? () => {
          this.timerId = setTimeout(
            () => this.tick(performance.now()),
            this.step
          )
        }
      : () => {
          this.timerId = requestAnimationFrame((time) => this.tick(time))
        }

    this.on("play", () => {
      this.last = globalThis.document?.timeline
        ? document.timeline.currentTime
        : performance.now()
      this.loop()
    })

    this.on(
      "pause || stop || destroy",
      this.fps
        ? () => clearTimeout(this.timerId)
        : () => cancelAnimationFrame(this.timerId)
    )
  }

  clear() {
    this.fps //
      ? clearTimeout(this.timerId)
      : cancelAnimationFrame(this.timerId)
  }

  tick(time) {
    if (this.playing) {
      this.update(((time - this.last) * this.speed) / 1000)
      this.last = time
      this.loop()
    }
  }
}
