import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import listen from "../../fabric/event/listen.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import dt from "../../core/dt.js"
import uid from "../../core/uid.js"
import noop from "../../fabric/type/function/noop.js"
import indexOfElement from "../../fabric/dom/indexOfElement.js"
import ensureScopeSelector from "../../fabric/event/ensureScopeSelector.js"
import setTemp from "../../fabric/dom/setTemp.js"
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

const style = document.createElement("style")
style.id = "ui-trait-transferable"
document.head.append(style)

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
      }
    }

    const replaceEmptySpace = hint
      ? paintDebounce(({ x, y }) => {
          const { textContent } = style
          style.textContent = ""
          const X = x
          const Y = y
          const item = document.elementFromPoint(X, Y)?.closest(selector)
          if (item) {
            const index = getNewIndex(X, Y, item, orientation)
            style.textContent = `
          ${selector}:nth-child(n+${index + 1}) {
            translate: ${hint.targetWidth}px;
          }`
          } else style.textContent = textContent
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
          // const item = e.target.closest(selector)
          // console.log(777, item)
        },

        "drop": async (e) => {
          // console.log("drop")
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

            requestAnimationFrame(() => {
              hint.restoreStyles = setTemp(target, {
                style: {
                  opacity: "0",
                  width: "0px",
                  flexBasis: "0px",
                  minWidth: "0",
                  paddingInline: "0",
                },
              })
              style.textContent = `
                ${selector}:nth-child(n+${index + 2}) {
                  translate: ${hint.targetWidth}px;
                }`
            })
          }
        },
        drag(e) {
          if (hint) {
            if (e.x) hint.ghost.style.translate = `${e.x - offsetX}px`
            replaceEmptySpace(e)
          }
        },
        dragend: (e, target) => {
          if (hint) {
            hint.ghost?.remove()
            hint.restoreStyles?.()
            style.textContent = ""
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
