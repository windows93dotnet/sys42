import ghostify from "../../../fabric/dom/ghostify.js"
import animate from "../../../fabric/dom/animate.js"
import paintThrottle from "../../../fabric/type/function/paintThrottle.js"
import indexOfElement from "../../../fabric/dom/indexOfElement.js"

const style1 = document.createElement("style")
style1.id = "ui-trait-transferable1"
document.head.append(style1)

const style2 = document.createElement("style")
style2.id = "ui-trait-transferable2"
document.head.append(style2)

export function getIndex(item) {
  const index = item.style.getPropertyValue("--index")
  return index ? Number(index) : indexOfElement(item)
}

export function getNewIndex(X, Y, item, orientation) {
  if (item) {
    const index = getIndex(item)
    if (orientation === "horizontal") {
      const { x, width } = item.getBoundingClientRect()
      if (X > x + width / 2) return index + 1
    } else {
      const { y, height } = item.getBoundingClientRect()
      if (Y > y + height / 2) return index + 1
    }

    return index
  }
}

export class SlideHint {
  constructor(e, { target, index, selector, orientation }) {
    this.index = index
    this.targetIndex = index
    this.selector = selector
    this.orientation = orientation
    this.insideDropzone = false

    const carrier = {}
    this.ghost = ghostify(target, { carrier })

    document.documentElement.append(this.ghost)

    this.offsetX = e.x
    this.offsetY = e.y
    this.lastX = e.x
    this.lastY = e.y
    this.targetY = carrier.y
    this.targetOffsetX = e.x - (carrier.x + carrier.width / 2)
    this.targetX = carrier.x
    this.targetOffsetY = e.y - (carrier.y + carrier.height / 2)

    if (orientation === "vertical") {
      const height = carrier.height + carrier.marginTop + carrier.marginBottom
      this.blankHalfSize = height / 2
      this.blank = `0 ${height}px`
      this.hideCurrent = `
        ${this.selector}:nth-child(${index + 1}) {
          opacity: 0 !important;
          height: 0px !important;
          min-height: 0px !important;
          flex-basis: 0px !important;
          padding-block: 0px !important;
          outline: none !important;
        }`
    } else {
      const width = carrier.width + carrier.marginLeft + carrier.marginRight
      this.blankHalfSize = width / 2
      this.blank = `${width}px`
      this.hideCurrent = `
        ${this.selector}:nth-child(${index + 1}) {
          opacity: 0 !important;
          width: 0px !important;
          min-width: 0px !important;
          flex-basis: 0px !important;
          padding-inline: 0px !important;
          outline: none !important;
        }`
    }

    cancelAnimationFrame(this._raf1)
    cancelAnimationFrame(this._raf2)
    this._raf1 = requestAnimationFrame(() => {
      if (this.insideDropzone) {
        style1.textContent = `
        ${this.hideCurrent}
        ${this.selector}:nth-child(n+${index + 2}) {
          translate: ${this.blank};
        }`
      }

      this._raf2 = requestAnimationFrame(() => {
        style2.textContent = `
          ${this.selector} {
            transition: translate 120ms ease-in-out;
            outline: none !important;
          }`
      })
    })

    this.layout = paintThrottle(({ x, y }) => {
      let X
      let Y
      if (this.orientation === "vertical") {
        if (y === this.lastY) return
        X = x
        Y = y - this.targetOffsetY
        if (y > this.lastY) Y += this.blankHalfSize
        else Y -= this.blankHalfSize
        this.lastY = y
      } else {
        if (x === this.lastX) return
        X = x - this.targetOffsetX
        Y = y
        if (x > this.lastX) X += this.blankHalfSize
        else X -= this.blankHalfSize
        this.lastX = x
      }

      const item = document.elementFromPoint(X, Y)?.closest(selector)
      if (item) {
        this.index = getNewIndex(X, Y, item, this.orientation)
        style1.textContent = `
          ${this.hideCurrent}
          ${selector}:nth-child(n+${this.index + 1}) {
            translate: ${this.blank};
          }`
      }
    })
  }

  enter() {
    this.insideDropzone = true
  }

  leave() {
    this.insideDropzone = false
    style1.textContent = `${this.hideCurrent}`
  }

  update(e) {
    if (this.insideDropzone) {
      if (this.orientation === "vertical") {
        if (e.y) this.ghost.style.translate = `0 ${e.y - this.offsetY}px`
      } else if (e.x) this.ghost.style.translate = `${e.x - this.offsetX}px`
    } else if (e.x && e.y) {
      this.ghost.style.translate = `
        ${e.x - this.offsetX}px
        ${e.y - this.offsetY}px`
    }
  }

  stop() {
    this.stopped = true
    if (this.destroyed !== true) {
      style1.textContent = ""
      style2.textContent = ""
    }

    const dir = this.index > this.targetIndex ? 0 : 1
    const item = document.querySelector(
      `${this.selector}:nth-child(${this.index + dir})`
    )

    const { ghost } = this

    if (item) {
      item.style.opacity = 0
      const { x, y } = item.getBoundingClientRect()
      requestAnimationFrame(() => {
        const translate =
          this.orientation === "vertical"
            ? `0 ${y - this.targetY}px`
            : `${x - this.targetX}px`

        animate.to(ghost, { translate }, 120).then(() => {
          item.style.opacity = 1
          ghost.remove()
          style1.textContent = ""
          style2.textContent = ""
        })
      })
    } else {
      ghost.remove()
    }
  }

  destroy() {
    if (this.stopped) return
    this.destroyed = true
    this.index = this.targetIndex
    style1.textContent = `
      ${this.hideCurrent}
      ${this.selector}:nth-child(n+${this.index + 1}) {
        translate: ${this.blank};
      }`
    this.stop(true)
  }
}

export default SlideHint
