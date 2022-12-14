import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import uid from "../../core/uid.js"
import noop from "../../fabric/type/function/noop.js"
import ensureScopeSelector from "../../fabric/event/ensureScopeSelector.js"

const DEFAULTS = {
  selector: ":scope > *",
  dropzone: undefined,
  effects: ["copy", "move", "link"],
  // driver: "dragEvent",
  driver: "pointerEvent",
  hint: "slide",
  // hint: { type: "float" },
}

let isSorting = false

const configure = settings("ui.trait.transferable", DEFAULTS)

class Transferable extends Trait {
  constructor(el, options) {
    super(el, options)

    if (options?.list) {
      this.list = options?.list
      delete options?.list
    }

    this.config = configure(options)

    if (typeof this.config.driver === "string") {
      this.config.driver = { type: this.config.driver }
    }

    if (typeof this.config.hint === "string") {
      this.config.hint = { type: this.config.hint }
    }

    this.effects = this.list
      ? options?.effects ?? ["copy", "move"]
      : this.config.effects

    this.dropzone = this.config.dropzone
      ? ensureElement(this.config.dropzone, this.el)
      : this.el

    this.dropzone.id ||= uid()
    const { id } = this.dropzone

    this.selector = ensureScopeSelector(this.config.selector, this.el)

    this.indexChange = this.config.indexChange ?? noop

    this.import = (obj) => {
      if (obj.data?.id === id) isSorting = true
      if (this.config.import) return this.config.import(obj)

      let { data, effect, index, dropzone, x, y } = obj

      if (data?.type === "layout") {
        if (this.list) {
          if (index === undefined) {
            index = this.list.length
          }

          if (data.id === id) {
            if (data.index === index) return
            const [removed] = this.list.splice(data.index, 1)
            if (index > data.index) index--
            this.list.splice(index, 0, removed)
          } else {
            this.list.splice(index, 0, data.state)
          }

          this.indexChange(index)
        } else {
          import("../components/dialog.js").then(({ dialog }) => {
            const { state } = data
            state.x = x - 64
            state.y = y - 16
            dialog(state)
          })
        }
      } else if (data?.type === "element") {
        let el = document.querySelector(data.selector)
        if (el) {
          if (effect === "copy") {
            el = el.cloneNode(true)
            el.id += "-copy"
          }

          dropzone.insertBefore(el, dropzone.children[index])
        }
      }
    }

    this.export = (obj) => {
      isSorting = false
      if (this.config.export) return this.config.export(obj)

      const { index, target } = obj
      if (this.list) {
        const state = this.list.at(index)
        return { id, type: "layout", index, state }
      }

      target.id ||= uid()
      return { id, type: "element", selector: `#${target.id}` }
    }

    this.removeItem = (obj) => {
      if (isSorting) return
      if (this.config.removeItem) return this.config.removeItem(obj)

      const { index, target } = obj
      if (this.list) this.list.splice(index, 1)
      else target.remove()
    }

    import(`./transferable/drivers/${this.config.driver.type}Driver.js`) //
      .then((m) => m.default(this, this.config.driver))
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
