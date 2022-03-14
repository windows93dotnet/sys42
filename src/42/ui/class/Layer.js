import setCursor from "../utils/setCursor.js"
import Emitter from "../../fabric/class/Emitter.js"
import render from "../render.js"
import uid from "../../type/random/uid.js"
import setTemp from "../../type/dom/setTemp.js"
import { autofocus } from "../../type/dom/focus.js"

// tiling-dialog, floating-dialog, popups, tooltip, toasts

export default class Layer extends Emitter {
  static getOpener(opener) {
    if (opener) return opener
    if (document.activeElement && document.activeElement.localName !== "body") {
      document.activeElement.id ??= uid()
      return document.activeElement.id
    }
  }

  constructor(name) {
    super()
    this.name = name
    this.el = document.createElement("div")
    this.el.className = `layer-${name}`
    this.el.toggleAttribute("data-steady", true)
    this.map = new Map()
    document.body.prepend(this.el)
  }

  async add(def, ctx, options) {
    def.id ??= uid()
    const { id } = def
    if (this.map.has(id)) return

    const timerId = setTimeout(() => setCursor("progress"), 200)

    ctx.undones = undefined
    if (ctx.cancel) ctx.cancel = ctx.cancel.fork()

    if (options?.clear) await this.clear(options?.clear)
    const item = render(def, ctx).firstChild
    const restore = setTemp(item, {
      style: {
        "opacity": 0,
        "pointer-events": "none",
      },
    })

    this.el.append(item)

    const opener = Layer.getOpener(options?.opener)
    this.map.set(id, { ctx, item, opener })

    await ctx.undones

    if (options?.autofocus && this.map.has(id)) {
      autofocus(item, options.autofocus)
    }

    requestAnimationFrame(() => {
      clearTimeout(timerId)
      setCursor()
      restore()
    })

    return { id, item, ctx }
  }

  async delete(id, options) {
    if (this.map.has(id)) {
      const { item, ctx, opener } = this.map.get(id)
      ctx.cancel()
      item.remove()
      this.map.delete(id)
      this.emit("delete", { id, opener }, options)
    }
  }

  async deleteAfter(id, options) {
    let found = false

    if (this.map.has(id)) {
      const entries = this.map.entries()
      for (const [entryId, { item, ctx, opener }] of entries) {
        if (!found && entryId === id) {
          found = true
          if (options?.excludeCurrent) continue
        }

        if (found) {
          ctx.cancel()
          item.remove()
          this.map.delete(entryId)
          this.emit("delete", { id: entryId, opener }, options)
        }
      }
    }
  }

  async clear(options) {
    const reverseEntries = [...this.map.entries()].reverse()
    for (const [id, { item, ctx, opener }] of reverseEntries) {
      ctx.cancel()
      item.remove()
      this.emit("delete", { id, opener }, options)
    }

    this.map.clear()
  }
}
