import { animateTo } from "../../../fabric/dom/animate.js"
import getRects from "../../../fabric/dom/getRects.js"
import { inRect } from "../../../fabric/geometry/point.js"
import appendCSS from "../../../fabric/dom/appendCSS.js"
import defer from "../../../fabric/type/promise/defer.js"
import noop from "../../../fabric/type/function/noop.js"
import paint from "../../../fabric/type/promise/paint.js"
import uid from "../../../core/uid.js"

const { parseInt, isNaN } = Number

export class SlideDropzoneHint {
  constructor(el, options) {
    this.el = el
    this.rects = []

    this.config = { ...options }
    this.config.orientation ??= this.el.getAttribute("aria-orientation")

    if (!this.config.orientation) {
      this.config.orientation = "horizontal"
      this.config.freeAxis ??= true
    }

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

    this.dragover = noop
  }

  async updateRects(items, cb) {
    this.rects.length = 0
    return getRects(this.config.selector, {
      root: this.el,
      intersecting: true,
    }).then((rects) => {
      if (items && cb) {
        for (const rect of rects) {
          for (const item of items) if (item.target === rect.target) continue
          if (cb(rect) !== false) this.rects.push(rect)
        }
      } else {
        this.rects.push(...rects)
      }

      return this.rects
    })
  }

  init() {
    this.firstEnterDone = false

    const { signal } = this.config
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
    this.css.transition.disable()
  }

  cleanup() {
    this.css.global.destroy()
    this.css.enter.destroy()
    this.css.dragover.destroy()
    this.css.transition.destroy()
  }

  async enter(items, x, y) {
    this.el.classList.add("dragover")
    this.css.transition.disable()

    // Temporary disable dragover
    // --------------------------
    this.dragover = noop

    this.enterReady = defer()
    this.inOriginalDropzone = items.dropzoneId === this.el.id
    this.newIndex = undefined

    const [first] = items
    this.blankWidth = `${
      first.width + first.marginLeft + first.marginRight + this.colGap
    }px 0`

    if (this.firstEnterDone || !this.inOriginalDropzone) {
      await this.updateRects()
      this.css.transition.enable()
    } else {
      this.firstEnterDone = true
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
      await this.updateRects(items, (rect) => {
        if (previousY !== rect.y) offset = 0
        previousY = rect.y

        for (const item of items) {
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

    // Enable dragover
    // ---------------
    this.dragover = (items, x, y) => {
      const [first] = items

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

    this.dragover(items, x, y)

    this.enterReady.resolve()
  }

  async leave() {
    this.dragover = noop
    this.el.classList.remove("dragover")
    await this.enterReady
    this.rects.length = 0
    this.css.enter.disable()
    this.css.dragover.disable()
  }

  async revert(items, finished) {
    this.dragover = noop
    this.css.dragover.disable()
    this.css.enter.enable()
    await finished
    this.css.transition.disable()
    this.css.enter.disable()
    for (const item of items) item.target.classList.remove("hide")
  }

  async drop(items) {
    this.dragover = noop
    await this.leave()
    this.css.transition.disable()

    const { selector } = this.config
    const undones = []
    let droppeds = []

    if (this.config.list) {
      const add = []
      if (this.inOriginalDropzone) {
        for (const item of items) {
          item.target.classList.remove("hide")
          this.config.list.splice(item.index, 1)
          if (this.newIndex > item.index) this.newIndex--
          add.push(item.data)
        }
      } else {
        for (const item of items) {
          item.target.classList.remove("hide")
          add.push(item.data)
        }
      }

      this.config.list.splice(this.newIndex, 0, ...add)
      await paint()

      const start = this.newIndex + 1
      const end = this.newIndex + add.length

      droppeds = document.querySelectorAll(
        `${selector}:nth-child(n+${start}):nth-child(-n+${end})`
      )

      for (let i = 0, l = droppeds.length; i < l; i++) {
        droppeds[i].classList.add("invisible")
        droppeds[i].id ||= uid()
        items[i].target = droppeds[i]
      }
    } else {
      const frag = document.createDocumentFragment()

      const indexedElement =
        this.newIndex === undefined
          ? undefined
          : this.el.querySelector(
              `${this.config.selector}:nth-child(${this.newIndex + 1})`
            )

      for (const item of items) {
        item.target.classList.remove("hide")
        item.target.classList.add("invisible")
        droppeds.push(item.target)
        frag.append(item.target)
      }

      if (indexedElement && !droppeds.includes(indexedElement)) {
        this.el.insertBefore(frag, indexedElement)
      } else this.el.append(frag)
    }

    await paint()
    const rects = await getRects(droppeds, {
      root: this.el,
      intersecting: true,
    })

    for (let i = 0, l = items.length; i < l; i++) {
      const item = items[i]
      if (rects[i] && items.config.dropAnimation) {
        undones.push(
          animateTo(item.ghost, {
            translate: `${rects[i].x}px ${rects[i].y}px`,
            ...items.dropAnimation(item),
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
