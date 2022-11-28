import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import listen from "../../fabric/event/listen.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import dt from "../../core/dt.js"
import uid from "../../core/uid.js"
import noop from "../../fabric/type/function/noop.js"
import indexOfElement from "../../fabric/dom/indexOfElement.js"
import ensureScopeSelector from "../../fabric/event/ensureScopeSelector.js"
import ghostify from "../../fabric/dom/ghostify.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"
import animate from "../../fabric/dom/animate.js"

const DEFAULTS = {
  items: ":scope > *",
  orientation: undefined,
  dropzone: undefined,
  effects: ["copy", "move", "link"],
  silentEffectCheck: false,
  handle: false,
  hint: "slide",
}

const style1 = document.createElement("style")
style1.id = "ui-trait-transferable1"
document.head.append(style1)

const style2 = document.createElement("style")
style2.id = "ui-trait-transferable2"
document.head.append(style2)

const configure = settings("ui.trait.transferable", DEFAULTS)

function exportElement(target) {
  target.id ||= uid()
  return { type: "element", id: target.id }
}

function importElement({ data, effect }, { dropzone }) {
  if (data?.type === "element") {
    let el = document.querySelector(`#${data.id}`)
    if (effect === "copy") el = el.cloneNode(true)
    dropzone.append(el)
  }
}

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

let hint

class Transferable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)
    let effects
    const dropzone = this.config.dropzone
      ? ensureElement(this.config.dropzone)
      : el

    dropzone.id ||= uid()
    const { id } = dropzone

    const orientation =
      this.config.orientation ??
      dropzone.getAttribute("aria-orientation") ??
      "horizontal"

    const selector = ensureScopeSelector(this.config.items, dropzone)

    let isSorting = false

    const replaceEmptySpace = paintThrottle(({ x, y }) => {
      if (x === hint.lastX) return

      let X = x - hint.targetOffsetX
      const Y = y

      if (x > hint.lastX) {
        X += hint.blankHalfWidth
      } else {
        X -= hint.blankHalfWidth
      }

      hint.lastX = x

      const item = document.elementFromPoint(X, Y)?.closest(selector)
      if (item) {
        const index = getNewIndex(X, Y, item, orientation)
        hint.index = index
        style1.textContent = `
          ${hint.hideCurrent}
          ${selector}:nth-child(n+${index + 1}) {
            translate: ${hint.blankWidth}px;
          }`
      }
    })

    if (options?.list) {
      const { list } = options
      effects = options.effects ?? ["copy", "move"]

      this.indexChange = this.config.indexChange ?? noop

      this.import = ({ data }, { index }) => {
        if (data?.type === "list") {
          if (index === undefined) {
            index = list.length
          }

          if (data.id === id) {
            isSorting = true
            if (data.index === index) return

            const [removed] = list.splice(data.index, 1)
            if (index > data.index) index--
            list.splice(index, 0, removed)
          } else {
            list.splice(index, 0, data.state)
          }

          this.indexChange(index)
        }
      }

      this.export = ({ index }) => {
        const state = list.at(index)
        return { type: "list", id, index, state }
      }

      this.removeItem = (index) => {
        list.splice(index, 1)
      }
    } else {
      effects = this.config.effects
      this.export = this.config.export ?? exportElement
      this.import = this.config.import ?? importElement
      this.removeItem = this.config.removeItem ?? noop
    }

    listen(
      dropzone,
      {
        "prevent": true,
        "dragover || dragenter": (e) => dt.effects.handleEffect(e, this.config),
        "dragover"(e) {
          if (hint) replaceEmptySpace(e)
        },
        "drop": async (e) => {
          const res = dt.import(e, this.config)
          if (hint) {
            style1.textContent = ""
            style2.textContent = ""

            const { index } = hint
            this.import(res, { index })

            const { ghost } = hint
            const dir = hint.index > hint.targetIndex ? 0 : 1
            const item = document.querySelector(
              `${selector}:nth-child(${hint.index + dir})`
            )
            if (item) {
              item.style.opacity = 0
              requestAnimationFrame(() => {
                const { x } = item.getBoundingClientRect()
                animate
                  .to(
                    ghost,
                    { translate: `${x - hint.targetX}px` },
                    { ms: 180 }
                  )
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
          } else {
            const item = e.target.closest(selector)
            const index = getNewIndex(e.x, e.y, item, orientation)
            this.import(res, { index })
          }
        },
      },
      el,
      {
        selector,
        pointerdown(e, target) {
          target.draggable = true
        },
        dragstart: (e, target) => {
          isSorting = false
          const index = getIndex(target)
          dt.export(e, { effects, data: this.export({ index, target }) })

          if (this.config.hint === "slide") {
            hint?.ghost?.remove()
            hint = {
              index,
              targetIndex: index,
              ghost: undefined,
              blankWidth: 0,
              offsetX: e.x,
              lastX: e.x,
            }

            const c = {}
            hint.ghost = ghostify(target, { carrier: c })
            document.documentElement.append(hint.ghost)

            hint.targetX = c.x
            hint.targetOffsetX = e.x - (c.x + c.width / 2)
            hint.blankWidth = c.width + c.marginLeft + c.marginRight
            hint.blankHalfWidth = hint.blankWidth / 2

            hint.hideCurrent = `
              ${selector}:nth-child(${index + 1}) {
                opacity: 0 !important;
                width: 0px !important;
                flex-basis: 0px !important;
                min-width: 0px !important;
                padding-inline: 0px !important;
                outline: none !important;
              }`

            cancelAnimationFrame(hint.raf1)
            cancelAnimationFrame(hint.raf2)
            hint.raf1 = requestAnimationFrame(() => {
              style1.textContent = `
                ${hint.hideCurrent}
                ${selector}:nth-child(n+${index + 2}) {
                  translate: ${hint.blankWidth}px;
                }`
              hint.raf2 = requestAnimationFrame(() => {
                style2.textContent = `
                  ${selector} {
                    transition: translate 120ms ease-in-out;
                    outline: none !important;
                  }`
              })
            })
          }
        },
        drag(e) {
          if (hint) {
            if (e.x) hint.ghost.style.translate = `${e.x - hint.offsetX}px`
          }
        },
        dragend(e, target) {
          if (isSorting) return void (isSorting = false)
          if (e.dataTransfer.dropEffect === "move") {
            const index = getIndex(target)
            this.removeItem(index)
          }
        },
      }
    )
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
