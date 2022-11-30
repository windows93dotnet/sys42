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
  selector: ":scope > *",
  dropzone: undefined,
  orientation: undefined,
  effects: ["copy", "move", "link"],
  silentEffectCheck: false,
  fileSystemHandle: false,
  hint: "slide",
}

const configure = settings("ui.trait.transferable", DEFAULTS)

let hint
let originHint

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

    if (options?.list) {
      this.list = options?.list
      delete options?.list
    }

    this.config = configure(options)

    let effects
    this.dropzone = this.config.dropzone
      ? ensureElement(this.config.dropzone)
      : el

    this.dropzone.id ||= uid()
    const { id } = this.dropzone

    this.isSorting = false

    this.orientation =
      this.config.orientation ??
      this.dropzone.getAttribute("aria-orientation") ??
      "horizontal"

    this.selector = ensureScopeSelector(this.config.selector, this.dropzone)

    if (this.list) {
      effects = options.effects ?? ["copy", "move"]

      this.indexChange = this.config.indexChange ?? noop

      this.import = function ({ data }, { index }) {
        if (data?.type === "list") {
          if (index === undefined) {
            index = this.list.length
          }

          if (data.id === id) {
            this.isSorting = true
            if (data.index === index) return

            const [removed] = this.list.splice(data.index, 1)
            if (index > data.index) index--
            this.list.splice(index, 0, removed)
          } else {
            this.list.splice(index, 0, data.state)
          }

          this.indexChange(index)
        }
      }

      this.export = function ({ index }) {
        const state = this.list.at(index)
        return { type: "list", id, index, state }
      }

      this.removeItem = (index) => {
        this.list.splice(index, 1)
      }
    } else {
      effects = this.config.effects
      this.export = this.config.export ?? exportElement
      this.import = this.config.import ?? importElement
      this.removeItem = this.config.removeItem ?? noop
    }

    let counter = 0
    let justStarted = false

    /* dropzone
      =========== */

    listen(this.dropzone, {
      prevent: true,

      dragover: (e) => {
        dt.effects.handleEffect(e, this.config)
        hint?.layout?.(e)
      },

      dragenter: (e) => {
        dt.effects.handleEffect(e, this.config)
        if (counter++ === 0) {
          this.dropzone.classList.add("dragover")
          if (hint) {
            // force index to end of the list if no item is hovered before drop
            hint.index =
              this.list?.length ??
              this.dropzone.querySelectorAll(this.selector).length

            if (hint.id === id) {
              hint.enterDropzone?.()
            } else {
              originHint = hint
              hint = new SlideHint(this, {
                x: e.x,
                y: e.y,
                target: originHint.ghost,
                index: originHint.index,
              })
              originHint.ghost.style.opacity = 0
            }
          }
        }
      },

      dragleave: () => {
        if (--counter <= 0) {
          counter = 0
          this.dropzone.classList.remove("dragover")

          if (originHint) {
            hint.destroy()
            hint = originHint
            originHint = undefined
          }

          hint?.leaveDropzone?.()
        }
      },

      drop: (e) => {
        counter = 0
        this.dropzone.classList.remove("dragover")

        const res = dt.import(e, this.config)
        if (hint) {
          const { index } = hint
          this.import(res, { index })
          hint?.stop?.(e)
        } else {
          const item = e.target.closest(this.selector)
          const index = getNewIndex(e.x, e.y, item, this.orientation)
          this.import(res, { index })
        }
      },
    })

    if (!this.selector) return

    /* draggable items
      ================== */

    listen(this.el, {
      selector: this.selector,

      pointerdown(e, target) {
        target.draggable = true // force draggable on element
      },

      dragstart: (e, target) => {
        counter = 0
        this.isSorting = false
        justStarted = true
        const index = getIndex(target)
        dt.export(e, { effects, data: this.export({ index, target }) })

        if (this.config.hint === "slide") {
          hint = new SlideHint(this, { x: e.x, y: e.y, target, index })
        }
      },

      drag(e) {
        if (justStarted) {
          // fast drag sometimes don't trigger dragleave event
          const isInDropzone = document
            .elementFromPoint(e.x, e.y)
            ?.closest(`#${id}`)
          if (!isInDropzone) hint?.leave?.(e)
          justStarted = false
        }

        hint?.update?.(e)
      },

      dragend: (e, target) => {
        justStarted = false
        counter = 0
        this.dropzone.classList.remove("dragover")

        if (originHint) {
          originHint.destroy()
          originHint = undefined
        }

        if (e.dataTransfer.dropEffect === "none") {
          hint?.revert?.(e)
        } else {
          hint?.destroy?.(e)
        }

        hint = undefined

        if (this.isSorting) {
          this.isSorting = false
          return
        }

        if (e.dataTransfer.dropEffect === "move") {
          const index = getIndex(target)
          this.removeItem(index)
        }
      },
    })
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
