import ensureElement from "../../fabric/dom/ensureElement.js"
import configure from "../../core/configure.js"
import { inRect } from "../../fabric/geometry/point.js"

const DEFAULTS = {
  threshold: 40,
  delay: 200,
}

const exponential = (val) => (val / 8) ** 1.5

export class HoverScroll {
  constructor(el, options) {
    this.el = ensureElement(el)
    this.config = configure(DEFAULTS, options)
    this.start()
  }

  start() {
    this.hasScrollbars =
      this.el.scrollHeight > this.el.clientHeight ||
      this.el.scrollWidth > this.el.clientWidth

    if (this.hasScrollbars) {
      const { top, left, bottom, right } = this.el.getBoundingClientRect()
      this.top = top
      this.left = left
      this.bottom = bottom
      this.right = right

      this.threshTop = this.top + this.config.threshold
      this.threshLeft = this.left + this.config.threshold
      this.threshBottom = this.bottom - this.config.threshold
      this.threshRight = this.right - this.config.threshold
    }
  }

  update(point, cb) {
    if (!this.hasScrollbars) return
    clearTimeout(this.delayId)
    cancelAnimationFrame(this.loopId)

    const loop = () => {
      this.loopId = requestAnimationFrame(() => {
        if (!inRect(point, this)) {
          cancelAnimationFrame(this.loopId)
          this.loopId = undefined
          return
        }

        let isMovingY = true
        let isMovingX = true

        if (point.y < this.threshTop) {
          this.el.scrollTop -= exponential(this.threshTop - point.y)
        } else if (point.y > this.threshBottom) {
          this.el.scrollTop += exponential(point.y - this.threshBottom)
        } else isMovingY = false

        if (point.x < this.threshLeft) {
          this.el.scrollLeft -= exponential(this.threshLeft - point.x)
        } else if (point.x > this.threshRight) {
          this.el.scrollLeft += exponential(point.x - this.threshRight)
        } else isMovingX = false

        if (isMovingX || isMovingY) {
          cb?.()
          loop()
        } else this.loopId = undefined
      })
    }

    if (this.loopId) loop()
    else this.delayId = setTimeout(() => loop(), this.config.delay)
  }

  stop() {
    clearTimeout(this.delayId)
    cancelAnimationFrame(this.loopId)
    this.loopId = undefined
  }
}

export default HoverScroll
