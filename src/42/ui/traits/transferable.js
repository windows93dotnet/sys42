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
import paintDebounce from "../../fabric/type/function/paintDebounce.js"

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
  return Number(item.dataset.index ?? indexOfElement(item))
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
    let offsetX = 0

    let hint
    if (this.config.hint === "slide") {
      hint = {
        ghost: undefined,
        restoreStyles: undefined,
        targetWidth: 0,
        offsetX: 0,
        offsetY: 0,
        currentIndex: 0,
      }
    }

    const replaceEmptySpace = hint
      ? paintDebounce(({ x, y }) => {
          if (x === hint.lastX) return

          const { textContent } = style1
          style1.textContent = ""

          let X = x
          const Y = y
          let dir = 1

          if (x > hint.lastX) {
            X -= hint.targetWidth
            dir = 2
          }

          const item = document.elementFromPoint(X, Y)?.closest(selector)
          if (item) {
            const index = getNewIndex(X, Y, item, orientation)
            style1.textContent = `
              ${hint.hideCurrent}
              ${selector}:nth-child(n+${index + dir}) {
                translate: ${hint.targetWidth}px;
              }`
          }

          if (!item) {
            style1.textContent = textContent
          }

          hint.lastX = x
        })
      : noop

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
            if (data.index === index) return // nothing to move

            if (data.index > index) {
              list.splice(data.index, 1)
              list.splice(index, 0, data.state)
            } else {
              list.splice(index, 0, data.state)
              list.splice(data.index, 1)
              index--
            }
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
        "dragover || dragenter": (e) => {
          dt.effects.handleEffect(e, this.config)
        },
        "dragover"(e) {
          replaceEmptySpace(e)
        },

        "drop": async (e) => {
          const res = dt.import(e, this.config)
          const item = e.target.closest(selector)
          const index = getNewIndex(e.x, e.y, item, orientation)
          this.import(res, { item, index })
        },
      },
      el,
      {
        selector,
        pointerdown(e, target) {
          target.draggable = true
        },
        dragstart: (e, target) => {
          offsetX = e.x

          isSorting = false
          const index = getIndex(target)
          dt.export(e, { effects, data: this.export({ index, target }) })

          if (hint) {
            const carrier = {}
            hint.ghost = ghostify(target, { carrier })
            document.documentElement.append(hint.ghost)

            hint.targetWidth =
              carrier.width + carrier.marginLeft + carrier.marginRight

            hint.targetCenterX = e.x - (carrier.x + hint.targetWidth / 2)

            hint.currentIndex = index

            requestAnimationFrame(() => {
              hint.hideCurrent = `
                ${selector}:nth-child(${index + 1}) {
                  opacity: 0;
                  width: 0px;
                  flex-basis: 0px;
                  min-width: 0px;
                  padding-inline: 0px;
                }
              `
              style1.textContent = `
                ${hint.hideCurrent}
                ${selector}:nth-child(n+${index + 2}) {
                  translate: ${hint.targetWidth}px;
                }`

              style2.textContent = `
                ${selector} {
                  transition: translate 120ms ease-in-out;
                }`
            })
          }
        },
        drag(e) {
          if (hint) {
            if (e.x) hint.ghost.style.translate = `${e.x - offsetX}px`
          }
        },
        dragend: (e, target) => {
          if (hint) {
            hint.ghost?.remove()
            style1.textContent = ""
          }

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
