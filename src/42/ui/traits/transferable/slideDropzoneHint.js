import DropzoneHint from "./DropzoneHint.js"
import appendCSS from "../../../fabric/dom/appendCSS.js"
import { inRect } from "../../../fabric/geometry/point.js"
import getRects from "../../../fabric/dom/getRects.js"
import { animateTo } from "../../../fabric/dom/animate.js"
import paint from "../../../fabric/type/promise/paint.js"
// import uid from "../../../core/uid.js"

const { parseInt, isNaN } = Number

export class SlideDropzoneHint extends DropzoneHint {
  constructor(el, options) {
    super(el, { speed: 180, ...options, scan: true })

    this.styles = getComputedStyle(this.el)
    this.colGap = parseInt(this.styles.columnGap, 10)
    this.rowGap = parseInt(this.styles.rowGap, 10)
    if (isNaN(this.colGap)) this.colGap = 0
    if (isNaN(this.rowGap)) this.rowGap = 0

    const halfColGap = this.colGap / 2
    const halfRowGap = this.rowGap / 2
    this.gaps = {
      top: -halfRowGap,
      bottom: halfRowGap,
      left: -halfColGap,
      right: halfColGap,
    }
  }

  activate() {
    super.activate()

    const [first] = this.items
    this.blankWidth = `${
      first.width + first.marginLeft + first.marginRight + this.colGap
    }px 0`

    const { signal } = this
    const cssOptions = { signal }

    this.css = {
      global: appendCSS(cssOptions),
      enter: appendCSS(cssOptions),
      dragover: appendCSS(cssOptions),
      transition: appendCSS(cssOptions),
    }

    this.css.transition.update(`
      ${this.config.selector} {
        transition:
          margin-right ${this.config.speed}ms ease-in-out,
          translate ${this.config.speed}ms ease-in-out !important;
      }`)
  }

  async faintItems() {
    this.css.transition.disable()
    const rect = this.el.getBoundingClientRect()
    this.css.global.update(`
      #${this.el.id} {
        height: ${rect.height}px !important;
        width: ${rect.width}px !important;
      }`)

    const { selector } = this.config
    const enterCss = []
    let offset = 0
    let previousY

    // Get all visible items bounding rects and save css with empty holes
    // ------------------------------------------------------------------
    await this.scan(this.items, (rect) => {
      if (previousY !== rect.y) offset = 0
      previousY = rect.y

      for (const item of this.items) {
        if (item.target.id === rect.target.id) {
          offset +=
            item.width + item.marginLeft + item.marginRight + this.colGap
          const i = rect.index + 1
          enterCss.push(`
            ${selector}:nth-child(n+${i}) {
              translate: ${offset}px 0;
            }`)
          rect.target.classList.add("hide")
          return false
        }
      }
    })

    // Update bounding rects without dragged items
    // Use getBoundingClientRect to prevent flickering
    // -----------------------------------------------
    for (const item of this.rects) {
      Object.assign(item, item.target.getBoundingClientRect().toJSON())
    }

    // Animate empty holes
    // -------------------
    this.css.enter.update(enterCss.join("\n"))
    await paint()
    this.css.enter.disable()

    this.css.transition.enable()
  }

  reviveItem(item) {
    item.target.classList.remove("hide")
  }

  enter() {
    super.enter()
    this.css.dragover.enable()
  }

  leave() {
    super.leave()
    this.css.dragover.disable()
  }

  async dragover(x, y) {
    const [first] = this.items

    x -= first.offsetX - first.width / 2
    y -= first.offsetY - first.height / 2

    const point = { x, y }

    for (let i = 0, l = this.rects.length; i < l; i++) {
      const rect = this.rects[i]
      if (inRect(point, rect, this.gaps)) {
        this.newIndex = rect.index
        break
      } else if (x > rect.right + this.gaps.right && i === l - 1) {
        this.newIndex = rect.index + 1
      }
    }

    if (this.newIndex !== undefined) {
      this.css.dragover.update(`
        ${this.config.selector}:nth-child(n+${this.newIndex + 1}) {
          translate: ${this.blankWidth};
        }`)
    }
  }

  async revert() {
    super.revert()
    this.css.dragover.disable()
    this.css.enter.enable()
  }

  async drop() {
    super.drop()
    this.css.enter.disable()
    this.css.dragover.disable()
    this.css.transition.disable()

    const { selector } = this.config

    const undones = []
    const start = this.newIndex + 1
    const end = this.newIndex + this.items.length

    const droppeds = document.querySelectorAll(
      `${selector}:nth-child(n+${start}):nth-child(-n+${end})`
    )

    for (let i = 0, l = droppeds.length; i < l; i++) {
      droppeds[i].classList.add("invisible")
      // droppeds[i].id ||= uid()
      // this.items[i].target = droppeds[i]
    }

    // await paint()

    const rects = await getRects(droppeds, {
      root: this.el,
      intersecting: true,
    })

    for (let i = 0, l = this.items.length; i < l; i++) {
      const item = this.items[i]
      if (rects[i] && this.items.config.dropAnimation) {
        undones.push(
          animateTo(item.ghost, {
            translate: `${rects[i].x}px ${rects[i].y}px`,
            ...this.items.dropAnimation(item),
          }).then(() => {
            item.ghost.remove()
            rects[i].target.classList.remove("invisible")
          })
        )
      } else {
        item.ghost.remove()
        item.target.classList.remove("invisible")
      }
    }

    await Promise.all(undones)
  }
}

export function slideDropzoneHint(el, options) {
  return new SlideDropzoneHint(el, options)
}

export default slideDropzoneHint
