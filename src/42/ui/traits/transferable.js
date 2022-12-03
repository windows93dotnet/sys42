import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import uid from "../../core/uid.js"
import noop from "../../fabric/type/function/noop.js"
import ensureScopeSelector from "../../fabric/event/ensureScopeSelector.js"

import dragEventDriver from "./transferable/dragEventDriver.js"
import pointerEventDriver from "./transferable/pointerEventDriver.js"

const DEFAULTS = {
  selector: ":scope > *",
  dropzone: undefined,
  orientation: undefined,
  freeAxis: undefined,
  effects: ["copy", "move", "link"],
  silentEffectCheck: false,
  fileSystemHandle: false,
  driver: "dragEvent",
  // driver: "pointerEvent",
  hint: "slide",
}

const configure = settings("ui.trait.transferable", DEFAULTS)

class Transferable extends Trait {
  constructor(el, options) {
    super(el, options)

    if (options?.list) {
      this.list = options?.list
      delete options?.list
    }

    this.config = configure(options)

    this.effects = this.list
      ? options.effects ?? ["copy", "move"]
      : this.config.effects

    this.dropzone = this.config.dropzone
      ? ensureElement(this.config.dropzone)
      : el

    this.dropzone.id ||= uid()
    const { id } = this.dropzone

    this.isSorting = false

    this.freeAxis = this.config.freeAxis

    this.orientation =
      this.config.orientation ?? this.dropzone.getAttribute("aria-orientation")

    if (!this.orientation) {
      this.orientation = "horizontal"
      this.freeAxis ??= true
    }

    this.selector = ensureScopeSelector(this.config.selector, this.dropzone)

    this.indexChange = this.config.indexChange ?? noop

    this.import = function ({ data, effect }, { index, dropzone, x, y }) {
      if (data?.type === "layout") {
        if (this.list) {
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
        } else {
          import("../components/dialog.js").then(({ dialog }) => {
            const { state } = data
            state.x = x - 64
            state.y = y - 16
            dialog(state)
          })
        }
      } else if (data?.type === "element") {
        let el = document.querySelector(`#${data.id}`)
        if (el) {
          if (effect === "copy") el = el.cloneNode(true)
          dropzone.append(el)
        }
      }
    }

    this.export = function ({ index, target }) {
      if (this.list) {
        const state = this.list.at(index)
        return { type: "layout", id, index, state }
      }

      target.id ||= uid()
      return { type: "element", id: target.id }
    }

    this.removeItem = (index) => {
      if (this.list) {
        this.list.splice(index, 1)
      }
    }

    if (this.config.driver === "pointerEvent") pointerEventDriver(this)
    else if (this.config.driver === "dragEvent") dragEventDriver(this)
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
