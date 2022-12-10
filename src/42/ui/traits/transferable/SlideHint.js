import ghostify from "../../../fabric/dom/ghostify.js"
import animate from "../../../fabric/dom/animate.js"
import paintThrottle from "../../../fabric/type/function/paintThrottle.js"
import indexOfElement from "../../../fabric/dom/indexOfElement.js"

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

let raf1

export class SlideHint {
  static cloneHint(origin, obj = {}) {
    obj.ghost = origin.ghost

    obj.index = origin.index
    obj.targetIndex = origin.index

    obj.offsetX = origin.offsetX
    obj.offsetY = origin.offsetY
    obj.lastX = origin.lastX
    obj.lastY = origin.lastY
    obj.targetY = origin.targetY
    obj.targetX = origin.targetX
    obj.targetOffsetX = origin.targetOffsetX
    obj.targetOffsetY = origin.targetOffsetY
    obj.targetHeight = origin.targetHeight
    obj.targetWidth = origin.targetWidth
    return obj
  }

  constructor(trait, { x, y, index, target, ghost, origin }) {
    this.trait = trait
    this.onabort = () => this.destroy()
    this.trait.cancel.signal.addEventListener("abort", this.onabort)

    this.id = trait.dropzone?.id
    this.selector = trait.selector
    this.orientation = trait.orientation
    this.freeAxis = trait.freeAxis
    this.insideDropzone = false

    this.dynamicStyle = document.createElement("style")
    this.dynamicStyle.id = "ui-trait-transferable1"
    document.head.append(this.dynamicStyle)

    this.allItemsStyle = document.createElement("style")
    this.allItemsStyle.id = "ui-trait-transferable2"
    document.head.append(this.allItemsStyle)

    if (origin) {
      SlideHint.cloneHint(origin, this)
      this.keepGhost = true
    } else {
      this.index = index
      this.targetIndex = index

      let area
      if (ghost) {
        area = ghostify.area(ghost)
        this.ghost = ghost
        this.keepGhost = true
      } else {
        area = {}
        this.ghost = ghostify(target, { area })
        document.documentElement.append(this.ghost)
      }

      this.offsetX = x - area.x
      this.offsetY = y - area.y
      this.lastX = x
      this.lastY = y
      this.targetY = area.y
      this.targetX = area.x
      this.targetOffsetX = x - (area.x + area.width / 2)
      this.targetOffsetY = y - (area.y + area.height / 2)
      this.targetHeight = area.height + area.marginTop + area.marginBottom
      this.targetWidth = area.width + area.marginLeft + area.marginRight
    }

    if (this.orientation === "vertical") {
      this.blankHalfSize = this.targetHeight / 2
      this.blank = `0 ${this.targetHeight}px`
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
      this.blankHalfSize = this.targetWidth / 2
      this.blank = `${this.targetWidth}px`
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

    this.dynamicStyle.textContent = `
      ${this.hideCurrent}
      ${this.selector}:nth-child(n+${index + 2}) { translate: ${this.blank}; }`

    raf1 = requestAnimationFrame(() => {
      this.allItemsStyle.textContent = `
        ${this.selector} {
          transition: translate 120ms ease-in-out !important;
          outline: none !important;
        }`
    })

    this.layout = paintThrottle((x, y) => {
      if (x === this.lastX && y === this.lastY) return

      let X
      let Y

      if (this.orientation === "vertical") {
        X = x
        Y = y === this.lastY ? y : y - this.targetOffsetY
        if (y >= this.lastY) Y += this.blankHalfSize
        else Y -= this.blankHalfSize
      } else {
        X = x === this.lastX ? x : x - this.targetOffsetX
        Y = y
        if (x >= this.lastX) X += this.blankHalfSize
        else X -= this.blankHalfSize
      }

      this.lastX = x
      this.lastY = y

      const target = document.elementFromPoint(X, Y)
      const item = target?.closest(this.selector)

      if (item) {
        this.index = getNewIndex(X, Y, item, this.orientation)
        this.dynamicStyle.textContent = `
          ${this.hideCurrent}
          ${this.selector}:nth-child(n+${this.index + 1}) {
            translate: ${this.blank};
          }`
      }
    })
  }

  enterDropzone() {
    this.insideDropzone = true
  }

  leaveDropzone() {
    this.insideDropzone = false
    this.dynamicStyle.textContent = `${this.hideCurrent}`
    queueMicrotask(() => {
      this.dynamicStyle.textContent = `${this.hideCurrent}`
    })
  }

  update(x, y) {
    if (x === 0 && y === 0) return

    if (this.insideDropzone && this.freeAxis !== true) {
      this.ghost.style.translate =
        this.orientation === "vertical"
          ? `${this.targetX}px ${y - this.offsetY}px`
          : `${x - this.offsetX}px ${this.targetY}px`
    } else if (x && y) {
      this.ghost.style.translate = `
        ${x - this.offsetX}px
        ${y - this.offsetY}px`
    }
  }

  stop() {
    this.stopped = true
    cancelAnimationFrame(raf1)
    this.layout.clear()

    if (this.reverted !== true) {
      this.dynamicStyle.textContent = ""
      this.allItemsStyle.textContent = ""
    }

    requestAnimationFrame(async () => {
      const dir = this.index > this.targetIndex ? 0 : 1
      const item = document.querySelector(
        `${this.selector}:nth-child(${this.index + dir})`
      )

      if (item) {
        const { opacity } = item.style
        item.style.opacity = 0
        const { x, y } = item.getBoundingClientRect()
        const styles = getComputedStyle(item)
        const marginTop = Number.parseInt(styles.marginTop, 10)
        const marginLeft = Number.parseInt(styles.marginLeft, 10)
        const translate = `${x - marginLeft}px ${y - marginTop}px`
        await animate.to(this.ghost, { translate }, 120).then(() => {
          item.style.opacity = opacity
          this.stopped = false
          this.keepGhost = false
          this.destroy()
        })
      } else {
        this.stopped = false
        this.keepGhost = false
        this.destroy()
      }
    })
  }

  revert() {
    if (this.stopped) return
    this.reverted = true
    this.index = this.targetIndex
    this.dynamicStyle.textContent = `
      ${this.hideCurrent}
      ${this.selector}:nth-child(n+${this.index + 1}) {
        translate: ${this.blank};
      }`
    this.stop()
  }

  destroy() {
    if (this.stopped) return
    this.trait.cancel.signal.removeEventListener("abort", this.onabort)

    if (this.keepGhost !== true) this.ghost.remove()

    this.dynamicStyle.remove()
    this.allItemsStyle.remove()
  }
}

export default SlideHint
