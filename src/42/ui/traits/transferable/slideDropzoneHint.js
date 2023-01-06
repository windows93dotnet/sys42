import { animateTo } from "../../../fabric/dom/animate.js"
import getRects from "../../../fabric/dom/getRects.js"
import appendCSS from "../../../fabric/dom/appendCSS.js"

const { parseInt, isNaN } = Number

export class SlideDropzoneHint {
  constructor(el, options) {
    this.el = el
    this.config = { ...options }
    this.speed = 180
    this.rects = []

    const { signal } = this.config

    this.css = {
      enter: appendCSS({ signal }),
      transition: appendCSS({ signal }),
    }

    this.styles = getComputedStyle(this.el)
    this.colGap = parseInt(this.styles.columnGap, 10)
    this.rowGap = parseInt(this.styles.rowGap, 10)
    if (isNaN(this.colGap)) this.colGap = 0
    if (isNaN(this.rowGap)) this.rowGap = 0
  }

  async updateRects(cb) {
    this.rects.length = 0
    await getRects(this.config.selector, {
      root: this.el,
      intersecting: true,
    }).then((rects) => {
      for (const item of rects) {
        this.rects.push(item)
        cb?.(item)
      }
    })
  }

  enter(items) {
    this.el.classList.add("dragover")

    let enterCss = ""
    let offset = 0

    this.css.transition.disable()

    this.updateRects((rect) => {
      for (const item of items) {
        if (
          item.target.id === rect.target.id &&
          !rect.target.classList.contains("hide")
        ) {
          offset += item.width + this.colGap
          const i = rect.index + 1
          enterCss += `${this.config.selector}:nth-of-type(n+${i}) {
            translate: ${offset}px 0;
          }`
          rect.target.classList.add("hide")
        }
      }
    }).then(() => {
      this.css.enter.update(enterCss)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.css.transition.update(`${this.config.selector} {
            transition: translate ${this.speed}ms ease-in-out !important;
          }`)
        })
      })
    })
  }

  leave() {
    this.el.classList.remove("dragover")
    this.rects.length = 0
    this.css.enter.disable()
  }

  dragover() {}

  async revert(items, finished) {
    this.css.enter.enable()
    await finished
    this.css.transition.disable()
    this.css.enter.disable()
    for (const item of items) item.target.classList.remove("hide")
  }

  async drop(items) {
    this.leave()
    this.css.transition.disable()
    this.css.enter.disable()

    const undones = []

    for (const item of items) {
      this.el.append(item.target)

      item.target.classList.remove("hide")
      const { x, y } = item.target.getBoundingClientRect()
      item.target.classList.add("hide")

      if (items.config.dropAnimation) {
        undones.push(
          animateTo(item.ghost, {
            translate: `${x}px ${y}px`,
            ...items.dropAnimation(item),
          }).then(() => {
            item.ghost.remove()
            item.target.classList.remove("hide")
          })
        )
      } else {
        item.ghost.remove()
        item.target.classList.remove("hide")
      }
    }

    await Promise.all(undones)
  }
}

export function slideDropzoneHint(el, options) {
  return new SlideDropzoneHint(el, options)
}

export default slideDropzoneHint