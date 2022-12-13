import ghostify from "../../../../fabric/dom/ghostify.js"
import animate from "../../../../fabric/dom/animate.js"
import paintThrottle from "../../../../fabric/type/function/paintThrottle.js"
import { getNewIndex } from "../getIndex.js"

const { parseInt, isNaN } = Number
const { round } = Math

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

    obj.targetMR = origin.targetMR
    obj.targetML = origin.targetML
    obj.targetMT = origin.targetMT
    obj.targetMB = origin.targetMB
    return obj
  }

  constructor(options) {
    if (options?.origin) {
      SlideHint.cloneHint(options.origin, this)
      this.keepGhost = true
    }

    if (options?.trait?.dropzone) this.addDropzone(options)
  }

  clone() {
    return SlideHint.cloneHint(this)
  }

  addDropzone({ trait, x, y, index, target, ghost, origin }) {
    this.trait = trait
    this.onabort = () => this.destroy()
    this.trait.cancel.signal.addEventListener("abort", this.onabort)

    this.id = trait.dropzone?.id
    this.selector = trait.selector
    this.speed = trait.config.hint.speed ?? 120
    this.freeAxis = trait.config.hint.freeAxis
    this.orientation =
      trait.config.hint.orientation ??
      trait.dropzone?.getAttribute("aria-orientation")

    if (!this.orientation) {
      this.orientation = "horizontal"
      this.freeAxis ??= true
    }

    this.insideDropzone = false

    this.dynamicStyle = document.createElement("style")
    this.dynamicStyle.id = "transferable-dynamicStyle"
    document.head.append(this.dynamicStyle)

    this.itemsStyle = document.createElement("style")
    this.itemsStyle.id = "transferable-itemsStyle"
    document.head.append(this.itemsStyle)

    const dzStyles = getComputedStyle(trait.dropzone)
    const dzRect = trait.dropzone.getBoundingClientRect()
    const dzPR = parseInt(dzStyles.paddingRight, 10)
    const dzPB = parseInt(dzStyles.paddingBottom, 10)
    let dzColGap = parseInt(dzStyles.columnGap, 10)
    let dzRowGap = parseInt(dzStyles.rowGap, 10)
    if (isNaN(dzColGap)) dzColGap = 0
    if (isNaN(dzRowGap)) dzRowGap = 0

    let area

    const dzId = trait.dropzone?.id

    if (!origin) {
      this.index = index
      this.targetIndex = index

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
      this.targetMR = area.marginRight
      this.targetML = area.marginLeft
      this.targetMT = area.marginTop
      this.targetMB = area.marginBottom
      this.targetOffsetX = x - (area.x + area.width / 2)
      this.targetOffsetY = y - (area.y + area.height / 2)
      this.targetHeight = round(
        area.height + dzRowGap + this.targetMT + this.targetMB
      )
      this.targetWidth = round(
        area.width + dzColGap + this.targetML + this.targetMR
      )
    }

    let dzStyle = ""

    const isGrid =
      dzStyles.display === "grid" || dzStyles.display === "inline-grid"

    if (this.orientation === "vertical") {
      if (!isGrid) {
        dzStyle = `padding-bottom: ${this.targetHeight + dzPB}px`
      }

      this.blankHalfSize = this.targetHeight / 2
      this.blank = `0 ${this.targetHeight}px`
    } else {
      if (!isGrid) {
        dzStyle = `padding-right: ${this.targetWidth + dzPR}px`
      }

      this.blankHalfSize = this.targetWidth / 2
      this.blank = `${this.targetWidth}px`
    }

    this.hideCurrent = `${this.selector}:nth-child(${index + 1}) {
        display: none !important;
      }`

    dzStyle = `
      #${dzId} {
        ${dzStyle} !important;
        width: ${dzRect.width}px !important;
        height: ${dzRect.height}px !important;
      }`

    this.dynamicStyle.textContent = `
      ${this.hideCurrent}
      ${dzStyle}
      ${this.selector}:nth-child(n+${index + 2}) { translate: ${this.blank}; }`

    raf1 = requestAnimationFrame(() => {
      this.itemsStyle.textContent = `
        ${dzStyle}
        ${this.selector} {
          transition: translate ${this.speed}ms ease-in-out !important;
          outline: none !important;
        }`
    })

    this.dragoverDropzone = paintThrottle((x, y) => {
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
    this.enterDropzone = () => {
      this.insideDropzone = true
    }

    this.leaveDropzone = () => {
      this.dragoverDropzone.clear()
      this.insideDropzone = false
      this.dynamicStyle.textContent = `${this.hideCurrent}`
    }
  }

  move(x, y) {
    if (x === 0 && y === 0) return // needed for "drag" event returning 0 before "drop" event

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
    this.dragoverDropzone.clear()

    if (this.reverted !== true) {
      this.dynamicStyle.textContent = ""
      this.itemsStyle.textContent = ""
    }

    requestAnimationFrame(async () => {
      const dir = this.index > this.targetIndex ? 0 : 1
      const item = document.querySelector(
        `${this.selector}:nth-child(${this.index + dir})`
      )

      if (item) {
        const { opacity } = item.style
        item.style.opacity = 0
        this.dynamicStyle.textContent = ""

        const { x, y } = item.getBoundingClientRect()

        if (this.reverted) {
          this.dynamicStyle.textContent = `
            ${this.hideCurrent}
            ${this.selector}:nth-child(n+${this.index + 1}) {
              translate: ${this.blank};
            }`
        }

        const translate = `${x}px ${y}px`
        await animate.to(this.ghost, { translate }, this.speed).then(() => {
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

    if (this.trait) {
      this.trait.cancel.signal.removeEventListener("abort", this.onabort)
    }

    if (this.keepGhost !== true) this.ghost.remove()

    this.dynamicStyle?.remove()
    this.itemsStyle?.remove()
  }
}

export default SlideHint
