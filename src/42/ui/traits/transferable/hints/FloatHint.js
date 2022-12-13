import ghostify from "../../../../fabric/dom/ghostify.js"
import setTemp from "../../../../fabric/dom/setTemp.js"
import setAttributes from "../../../../fabric/dom/setAttributes.js"
import configure from "../../../../core/configure.js"
import animate from "../../../../fabric/dom/animate.js"

const DEFAULT = {
  ghostAttrs: {},
  targetAttrs: {},
  speed: 120,
}

export class FloatHint {
  constructor(options) {
    if (options?.previous) {
      this.offsetX = options.previous.offsetX
      this.offsetY = options.previous.offsetY
      this.ghost = options.previous.ghost
      this.keepGhost = true
      return
    }

    this.config = configure(DEFAULT, options?.trait?.config?.hint)

    const area = {}
    this.ghost = ghostify(options.target, { area })
    document.documentElement.append(this.ghost)

    setAttributes(this.ghost, this.config.ghostAttrs)
    this.restoreTarget = setTemp(options.target, this.config.targetAttrs)

    const { x, y } = options

    this.targetX = area.x
    this.targetY = area.y

    this.offsetX = x - area.x
    this.offsetY = y - area.y
  }

  clone() {
    return {
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      ghost: this.ghost,
    }
  }

  move(x, y) {
    this.ghost.style.translate = `
      ${x - this.offsetX}px
      ${y - this.offsetY}px`
  }

  stop() {
    this.keepGhost = false
    this.destroy()
  }

  revert() {
    const translate = `${this.targetX}px ${this.targetY}px`
    animate.to(this.ghost, { translate }, this.config.speed).then(() => {
      this.keepGhost = false
      this.destroy()
    })
  }

  destroy() {
    if (this.keepGhost !== true) this.ghost.remove()
    this.restoreTarget?.()
  }
}

export default FloatHint
