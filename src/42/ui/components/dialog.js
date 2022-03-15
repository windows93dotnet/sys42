// @related https://github.com/KittyGiraudel/a11y-dialog

import Component from "../class/Component.js"
import compositor from "../ui/compositor.js"
import render from "../render.js"
import arrify from "../render.js"
import populateContext from "../utils/populateContext.js"
import makeNewContext from "../utils/makeNewContext.js"
import { h2, div, header, footer } from "../html.js"

let layer = compositor("dialogs")

export class Dialog extends Component {
  static definition = {
    tag: "ui-dialog",
    role: "dialog",
    tabIndex: -1,

    positionable: { position: "absolute" },
    movable: { position: "absolute", handle: ".ui-dialog__title" },
    // resizable: "*",

    defaults: {
      minimizable: true,
      maximizable: true,
      closable: true,
      live: false,
      modules: undefined,
    },

    properties: {
      active: true,
    },
  }

  async close(ok = false) {
    layer = await layer
    if (layer.map) layer.delete(this.id, { ok })
    else this.remove()
  }

  async apply() {
    if (this._.parentCtx) {
      let clone = structuredClone(this._.ctx.global.rack.value)

      if (this._.config.modules?.apply) {
        clone = await import(this._.config.modules.apply) //
          .then((m) => m.default(clone))
      }

      this._.parentCtx.global.state.set(this._.parentCtx.scope, clone)
    }
  }

  async cancel() {
    if ("backupData" in this._) {
      let { backupData } = this._

      if (this._.config.modules?.cancel) {
        backupData = await import(this._.config.modules.cancel) //
          .then((m) => m.default(backupData))
      }

      this._.parentCtx.global.state.set(this._.parentCtx.scope, backupData)
    }

    await this.close()
  }

  async ok() {
    await this.apply()
    await this.close(true)
  }

  $create({ root, content, label, config, ctx }) {
    if (config.live === false) {
      this._.parentCtx = ctx
      const data = this._.parentCtx.global.rack.get(this._.parentCtx.scope)
      ctx = makeNewContext()
      ctx.widget = this
      ctx.global.rack.value = structuredClone(data)
      this._.backupData ??= structuredClone(ctx.global.rack.value)
      this._.ctx = ctx
      this._.rest.footer ??= [
        { type: "button", run: "cancel", label: "Cancel" },
        { type: "button", run: "apply", label: "Apply" },
        { type: "button.btn-default", run: "ok", label: "Ok" },
      ]
    }

    const fragment = document.createDocumentFragment()

    label = arrify(label ?? "")

    if (config.closable) {
      label.push({
        type: "button",
        picto: "close",
        run: "close",
      })
    }

    fragment.append(
      header(
        { class: "ui-dialog__header" },
        render(label, ctx, undefined, (text) =>
          h2({ class: "ui-dialog__title" }, text)
        )
      )
    )

    if ("menubar" in this._.rest) {
      fragment.append(
        div(
          { class: "ui-dialog__menubar" }, //
          render(this._.rest.menubar, ctx)
        )
      )
    }

    fragment.append(
      div(
        { class: "ui-dialog__content" }, //
        render(content, ctx)
      )
    )

    if ("footer" in this._.rest) {
      fragment.append(
        footer(
          { class: "ui-dialog__footer" }, //
          render(this._.rest.footer, ctx)
        )
      )
    }

    root.append(fragment)
  }
}

await Component.define(Dialog)

export default async function dialog(def, ctx, options = {}) {
  layer = await layer

  ctx = makeNewContext(ctx)
  populateContext(ctx, def)
  def.type = "ui-dialog"

  options.autofocus = ".ui-dialog__content"
  const res = await layer.add(def, ctx, options)

  return new Promise((resolve) => {
    const off = layer.on("delete", { off: true }, ({ id }, { ok }) => {
      if (id === res.id) {
        off()
        resolve({ ok, value: ctx.global.state.value })
      }
    })
  })
}

/*  */

export async function prompt(message = "", options = {}) {
  if (typeof message === "object") {
    options = message
    message = options.message
  }

  if (typeof options === "string") options = { value: options }

  const res = await dialog({
    label: options.label ?? "Prompt",
    class: "ui-prompt" + options.class ? ` ${options.class}` : "",
    content: {
      type: ".box-h.my",
      content: {
        type: options.type ?? "input",
        name: "text",
        label: message,
      },
    },
    footer: options.footer ?? [
      { type: "button", run: "close" },
      { type: "button.btn-default", run: "ok" },
    ],
    data: {
      text: options.value ?? "",
    },
  })

  return res.ok ? res.value.text : undefined
}

dialog.prompt = prompt
