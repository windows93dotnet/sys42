import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import listen from "../../fabric/event/listen.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import dt from "../../core/dt.js"
import uid from "../../core/uid.js"
import noop from "../../fabric/type/function/noop.js"
import indexOfElement from "../../fabric/dom/indexOfElement.js"
import ensureScopeSelector from "../../fabric/event/ensureScopeSelector.js"

const DEFAULTS = {
  items: ":scope > *",
  itemsOrientation: undefined,
  dropzone: undefined,
  effects: ["copy", "move", "link"],
  silentEffectCheck: false,
  handle: false,
}

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

function getNewIndex(e, item, orientation) {
  if (item) {
    const index = getIndex(item)
    if (orientation === "horizontal") {
      const { x, width } = item.getBoundingClientRect()
      if (e.x > x + width / 2) return index + 1
    } else {
      const { y, height } = item.getBoundingClientRect()
      if (e.y > y + height / 2) return index + 1
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

    const itemsOrientation =
      this.config.itemsOrientation ??
      dropzone.getAttribute("aria-orientation") ??
      "horizontal"

    const selector = ensureScopeSelector(this.config.items, dropzone)

    let isSorting = false

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
          // const item = e.target.closest(selector)
          dt.effects.handleEffect(e, this.config)
        },
        "drop": async (e) => {
          const item = e.target.closest(selector)
          const index = getNewIndex(e, item, itemsOrientation)
          const res = dt.import(e, this.config)
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
          isSorting = false
          const index = getIndex(target)
          dt.export(e, { effects, data: this.export({ index, target }) })
        },
        dragend: (e, target) => {
          if (isSorting) {
            isSorting = false
            return
          }

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
