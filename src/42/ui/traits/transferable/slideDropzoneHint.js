import { animateTo } from "../../../fabric/dom/animate.js"
import getRects from "../../../fabric/dom/getRects.js"
import { inRect } from "../../../fabric/geometry/point.js"
import appendCSS from "../../../fabric/dom/appendCSS.js"
import defer from "../../../fabric/type/promise/defer.js"
import noop from "../../../fabric/type/function/noop.js"
import paint from "../../../fabric/type/promise/paint.js"

const { parseInt, isNaN } = Number

export class SlideDropzoneHint {
  constructor(el, options) {
    this.el = el
    this.config = { ...options }
    this.speed = this.config.animationSpeed
    this.rects = []

    this.orientation = "horizontal"

    const { signal } = this.config
    const cssOptions = { signal }

    this.css = {
      enter: appendCSS(cssOptions),
      dragover: appendCSS(cssOptions),
      transition: appendCSS(cssOptions),
    }

    this.css.transition.update(`
      ${this.config.selector} {
        transition:
          margin-right ${this.speed}ms ease-in-out,
          translate ${this.speed}ms ease-in-out !important;
      }`)
    this.css.transition.disable()

    this.styles = getComputedStyle(this.el)
    this.colGap = parseInt(this.styles.columnGap, 10)
    this.rowGap = parseInt(this.styles.rowGap, 10)
    if (isNaN(this.colGap)) this.colGap = 0
    if (isNaN(this.rowGap)) this.rowGap = 0

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
          this.rects.push(rect)
          cb(rect)
        }
      } else {
        this.rects.push(...rects)
      }

      return this.rects
    })
  }

  async enter(items, x, y) {
    this.el.classList.add("dragover")
    this.css.transition.disable()

    // Temporary disable dragover
    // --------------------------
    this.dragover = noop

    this.enterReady = defer()
    this.inOriginalDropzone ??= items.dropzoneId === this.el.id
    this.newIndex = undefined

    if (this.inOriginalDropzone) {
      const { selector } = this.config
      let enterCss = []
      let offset = 0
      let previousY

      // Get all visible items bounding rects and save css with empty holes
      // ------------------------------------------------------------------
      const rects = await this.updateRects(items, (rect) => {
        for (const item of items) {
          if (previousY !== rect.y) {
            if (enterCss.length > 0) {
              enterCss = enterCss.map((css) =>
                css.replace(":is(*)", `:nth-child(-n+${rect.index})`)
              )
              enterCss.push(
                `${selector}:nth-child(${rect.index}) {
                  /* rotate: 10deg !important; */
                  margin-right: ${offset}px;
                }`
              )
            }

            offset = 0
          }

          previousY = rect.y

          if (
            item.target.id === rect.target.id &&
            !rect.target.classList.contains("hide")
          ) {
            offset += item.width + this.colGap
            const i = rect.index + 1
            enterCss.push(
              `${selector}:nth-child(n+${i}):is(*) {
                translate: ${offset}px 0;
              }`
            )
            rect.target.classList.add("hide")
          }
        }
      })

      enterCss.push(
        `${selector}:nth-child(${rects.length}) {
          /* rotate: 10deg !important; */
          margin-right: ${offset}px;
        }`
      )

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
      // this.css.dragover.update(`
      //   ${this.config.selector}:nth-child(n+${items[0].index + 1}) {
      //     translate: ${items[0].width + this.colGap}px 0;
      //   }`)

      this.css.transition.enable()
    } else {
      await this.updateRects()
      this.css.transition.enable()
    }

    // Enable dragover
    // ---------------
    this.dragover = (items, x, y) => {
      const [first] = items
      // console.log(first)

      x -= first.offsetX
      y -= first.offsetY

      const point = { x, y }

      for (const rect of this.rects) {
        if (inRect(point, rect)) {
          this.newIndex = (
            this.orientation === "vertical"
              ? point.y > rect.y + rect.height / 2
              : point.x > rect.x + rect.width / 2
          )
            ? rect.index + 1
            : rect.index
          break
        }
      }

      if (this.newIndex !== undefined) {
        this.css.dragover.update(`
          ${this.config.selector}:nth-child(n+${this.newIndex + 1}) {
            translate: ${items[0].width + this.colGap}px 0;
          }`)
      }
    }

    this.dragover(items, x, y)

    this.enterReady.resolve()
  }

  async leave() {
    this.dragover = noop
    this.inOriginalDropzone = false
    this.el.classList.remove("dragover")
    await this.enterReady
    this.rects.length = 0
    this.css.enter.disable()
    this.css.dragover.disable()
  }

  async revert(items, finished) {
    this.dragover = noop
    this.inOriginalDropzone = undefined
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
    this.inOriginalDropzone = undefined
    this.css.transition.disable()

    const undones = []

    const droppeds = []
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
            item.target.classList.remove("invisible")
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
