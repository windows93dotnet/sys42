import DropzoneHint from "./DropzoneHint.js"
import appendCSS from "../../../fabric/dom/appendCSS.js"
import paint from "../../../fabric/type/promise/paint.js"
import sleep from "../../../fabric/type/promise/sleep.js"

export class SlideDropzoneHint extends DropzoneHint {
  constructor(el, options) {
    super(el, { ...options })
  }

  activate(x, y) {
    super.activate(x, y)

    const [first] = this.items

    if (this.isVertical) {
      const blank =
        first.height + first.marginTop + first.marginBottom + this.rowGap
      this.blank = `0 ${blank}px`
    } else {
      const blank =
        first.width + first.marginLeft + first.marginRight + this.columnGap
      this.blank = `${blank}px 0`
    }

    const { signal } = this
    const cssOptions = { signal }

    this.css = {
      global: appendCSS(cssOptions),
      blank: appendCSS(cssOptions),
      dragover: appendCSS(cssOptions),
      transition: appendCSS(cssOptions),
    }

    const speed = this.config.animationSpeed

    this.ignoreDragover = false

    this.css.transition.update(`
      ${this.config.selector} {
        transition:
          margin-right ${speed}ms ease-in-out,
          translate ${speed}ms ease-in-out !important;
      }`)
  }

  async faintTargets() {
    this.ignoreDragover = true

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
          const i = rect.index + 1
          let blank
          if (this.isVertical) {
            offset +=
              item.height + item.marginTop + item.marginBottom + this.rowGap
            blank = `0 ${offset}px`
          } else {
            offset +=
              item.width + item.marginLeft + item.marginRight + this.columnGap
            blank = `${offset}px 0`
          }

          enterCss.push(`
            ${selector}:nth-child(n+${i}) {
              translate: ${blank};
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
    this.css.blank.update(enterCss.join("\n"))
    await paint()
    this.css.transition.enable()
    this.css.blank.disable()

    this.ignoreDragover = false
  }

  faintTarget(target) {
    target.classList.add("hide")
  }
  reviveTarget(target) {
    target.classList.remove("hide")
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

    if (this.ignoreDragover) return

    if (this.newIndex === undefined) {
      this.css.dragover.update("")
    } else {
      this.css.dragover.update(`
        ${this.config.selector}:nth-child(n+${this.newIndex + 1}) {
          translate: ${this.blank};
        }`)
    }
  }

  revert() {
    super.revert()
    this.css.dragover.disable()
    this.css.blank.enable()
  }

  async drop() {
    await super.drop()
    this.css.blank.disable()
    this.css.dragover.disable()
    this.css.transition.disable()
  }

  async beforeAdoptAnimation(adopteds) {
    if (this.newIndex === undefined) return

    let n = this.newIndex + 1

    this.css.blank.enable()
    this.css.blank.update(`
      ${this.config.selector}:nth-child(n+${n}) {
        translate: ${this.blank};
      }`)

    await paint()
    this.css.transition.enable()

    if (!adopteds?.length) {
      this.css.blank.update("")
      await sleep(this.config.animationSpeed)
      return
    }

    n = this.newIndex + this.items.length

    let blank
    if (this.isVertical) {
      let { marginTop, marginBottom } = getComputedStyle(adopteds.at(0).target)
      if (adopteds.at(0) !== adopteds.at(-1)) {
        marginBottom = getComputedStyle(adopteds.at(-1).target).marginBottom
      }

      marginTop = Number.parseInt(marginTop, 10) | 0
      marginBottom = Number.parseInt(marginBottom, 10) | 0

      const height =
        this.columnGap +
        marginTop +
        marginBottom +
        adopteds.at(-1).bottom -
        adopteds.at(0).top

      blank = `0 ${height}px`
    } else {
      let { marginLeft, marginRight } = getComputedStyle(adopteds.at(0).target)
      if (adopteds.at(0) !== adopteds.at(-1)) {
        marginRight = getComputedStyle(adopteds.at(-1).target).marginRight
      }

      marginLeft = Number.parseInt(marginLeft, 10) | 0
      marginRight = Number.parseInt(marginRight, 10) | 0

      const width =
        this.columnGap +
        marginLeft +
        marginRight +
        adopteds.at(-1).right -
        adopteds.at(0).left

      blank = `${width}px 0`
    }

    this.css.blank.update(`
      ${this.config.selector}:nth-child(n+${n}) {
        translate: ${blank};
      }`)
  }
}

export function slideDropzoneHint(el, options) {
  return new SlideDropzoneHint(el, options)
}

export default slideDropzoneHint
