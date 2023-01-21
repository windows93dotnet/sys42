import DropzoneHint from "./DropzoneHint.js"
import appendCSS from "../../../fabric/dom/appendCSS.js"
import paint from "../../../fabric/type/promise/paint.js"

export class SlideDropzoneHint extends DropzoneHint {
  constructor(el, options) {
    super(el, { ...options })
  }

  activate(x, y) {
    super.activate(x, y)

    const [first] = this.items
    const blankWidth =
      first.width + first.marginLeft + first.marginRight + this.columnGap
    this.blankWidth = `${blankWidth}px 0`

    const { signal } = this
    const cssOptions = { signal }

    this.css = {
      global: appendCSS(cssOptions),
      enter: appendCSS(cssOptions),
      dragover: appendCSS(cssOptions),
      transition: appendCSS(cssOptions),
    }

    const speed = this.config.animationSpeed

    this.css.transition.update(`
      ${this.config.selector} {
        transition:
          margin-right ${speed}ms ease-in-out,
          translate ${speed}ms ease-in-out !important;
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
            item.width + item.marginLeft + item.marginRight + this.columnGap
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
    // await paint()
  }

  reviveItem(item) {
    item.target.classList.remove("hide")
  }

  enter() {
    super.enter()
    this.css.dragover.update("")
    this.css.dragover.enable()
  }

  leave() {
    super.leave()
    this.css.dragover.update("")
    this.css.dragover.disable()
  }

  dragover(x, y) {
    super.dragover(x, y)

    if (this.newIndex === undefined) {
      this.css.dragover.update("")
    } else {
      this.css.dragover.update(`
        ${this.config.selector}:nth-child(n+${this.newIndex + 1}) {
          translate: ${this.blankWidth};
        }`)
    }
  }

  revert() {
    super.revert()
    this.css.dragover.disable()
    this.css.enter.enable()
  }

  drop() {
    super.drop()
    this.css.enter.disable()
    this.css.dragover.disable()
    this.css.transition.disable()
  }
}

export function slideDropzoneHint(el, options) {
  return new SlideDropzoneHint(el, options)
}

export default slideDropzoneHint
