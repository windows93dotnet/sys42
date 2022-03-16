// thanks: https://github.com/sethvincent/gameloop/blob/master/index.js

import Player from "./Player.js"
import noop from "../type/function/noop.js"

export default class Loop extends Player {
  constructor(update = noop, { fps, speed = 1 } = {}) {
    super()
    this.update = update
    this.speed = speed
    this.fps = fps ?? 60
    this.step = 1000 / this.fps

    let timerId

    this.loop = fps
      ? () => {
          timerId = setTimeout(() => this.tick(performance.now()), this.step)
        }
      : () => {
          timerId = requestAnimationFrame((time) => this.tick(time))
        }

    this.on("play", () => {
      this.last = globalThis.document?.timeline
        ? document.timeline.currentTime
        : performance.now()
      this.loop()
    })

    this.on(
      "pause stop",
      fps ? () => clearTimeout(timerId) : () => cancelAnimationFrame(timerId)
    )
  }

  tick(time) {
    if (this.playing) {
      this.update(((time - this.last) * this.speed) / 1000)
      this.last = time
      this.loop()
    }
  }
}
