import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import listen from "../../fabric/event/listen.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import dt from "../../core/dt.js"
import uid from "../../core/uid.js"
import noop from "../../fabric/type/function/noop.js"
import ensureScopeSelector from "../../fabric/event/ensureScopeSelector.js"
import SlideHint, { getIndex, getNewIndex } from "./transferable/SlideHint.js"

const DEFAULTS = {
  items: ":scope > *",
  orientation: undefined,
  dropzone: undefined,
  effects: ["copy", "move", "link"],
  silentEffectCheck: false,
  handle: false,
  hint: "slide",
}

const configure = settings("ui.trait.transferable", DEFAULTS)

let hint

/* element
========== */
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

    if (options?.list) {
      const { list } = options
      effects = options.effects ?? ["copy", "move"]

      this.indexChange = this.config.indexChange ?? noop

      this.import = function ({ data }, { index }) {
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

      this.export = function ({ index }) {
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

    let counter = 0

    listen(
      /* dropzone
      =========== */
      dropzone,
      {
        "prevent": true,
        "dragover || dragenter": (e) => dt.effects.handleEffect(e, this.config),
        "dragover"(e) {
          hint?.layout?.(e)
        },
        "dragenter"(e) {
          if (counter === 0) {
            dropzone.classList.add("dragover")
            hint?.enter?.(e)
          }

          counter++
        },
        "dragleave"(e) {
          counter--
          if (counter === 0) {
            dropzone.classList.remove("dragover")
            hint?.leave?.(e)
          }
        },
        "drop": async (e) => {
          counter = 0
          dropzone.classList.remove("dragover")

          const res = dt.import(e, this.config)
          if (hint) {
            const { index } = hint
            this.import(res, { index })
            hint.stop(e)
          } else {
            const item = e.target.closest(selector)
            const index = getNewIndex(e.x, e.y, item, orientation)
            this.import(res, { index })
          }
        },
      },

      /* draggable items
      ================== */
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
            hint = new SlideHint(e, { target, index, selector, orientation })
          }
        },
        drag(e) {
          if (hint) hint.update(e)
        },
        dragend: (e, target) => {
          counter = 0
          dropzone.classList.remove("dragover")

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
