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

function getIndex(item) {
  const index = item.style.getPropertyValue("--index")
  return index ? Number(index) : indexOfElement(item)
}

function getNewIndex(X, Y, item, orientation) {
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
  constructor(e, target, index, selector, orientation) {
    this.index = index
    this.targetIndex = index
    this.blankWidth = 0
    this.offsetX = e.x
    this.lastX = e.x
    this.selector = selector
    this.orientation = orientation

    const carrier = {}
    this.ghost = ghostify(target, { carrier })

    document.documentElement.append(this.ghost)

    this.targetX = carrier.x
    this.targetOffsetX = e.x - (carrier.x + carrier.width / 2)
    this.blankWidth = carrier.width + carrier.marginLeft + carrier.marginRight
    this.blankHalfWidth = this.blankWidth / 2

    this.hideCurrent = `
      ${this.selector}:nth-child(${index + 1}) {
        opacity: 0 !important;
        width: 0px !important;
        flex-basis: 0px !important;
        min-width: 0px !important;
        padding-inline: 0px !important;
        outline: none !important;
      }`

    cancelAnimationFrame(this._raf1)
    cancelAnimationFrame(this._raf2)
    this._raf1 = requestAnimationFrame(() => {
      style1.textContent = `
        ${this.hideCurrent}
        ${this.selector}:nth-child(n+${index + 2}) {
          translate: ${this.blankWidth}px;
        }`
      this._raf2 = requestAnimationFrame(() => {
        style2.textContent = `
          ${this.selector} {
            transition: translate 120ms ease-in-out;
            outline: none !important;
          }`
      })
    })

    this.layout = paintThrottle(({ x, y }) => {
      if (x === this.lastX) return

      let X = x - this.targetOffsetX
      const Y = y

      if (x > this.lastX) {
        X += this.blankHalfWidth
      } else {
        X -= this.blankHalfWidth
      }

      this.lastX = x

      const item = document.elementFromPoint(X, Y)?.closest(selector)
      if (item) {
        const index = getNewIndex(X, Y, item, this.orientation)
        this.index = index
        style1.textContent = `
          ${this.hideCurrent}
          ${selector}:nth-child(n+${index + 1}) {
            translate: ${this.blankWidth}px;
          }`
      }
    })
  }

  update(e) {
    if (e.x) this.ghost.style.translate = `${e.x - this.offsetX}px`
  }

  stop() {
    style1.textContent = ""
    style2.textContent = ""
    const { ghost } = this
    const dir = this.index > this.targetIndex ? 0 : 1
    const item = document.querySelector(
      `${this.selector}:nth-child(${this.index + dir})`
    )

    if (item) {
      item.style.opacity = 0
      requestAnimationFrame(() => {
        const { x } = item.getBoundingClientRect()
        animate
          .to(ghost, { translate: `${x - this.targetX}px` }, { ms: 180 })
          .then(() => {
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
}

export default SlideHint
