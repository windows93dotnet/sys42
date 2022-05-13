// @related https://github.com/KittyGiraudel/a11y-dialog

import Component from "../class/Component.js"
import layerManager from "../layerManager.js"
import render from "../render.js"
import arrify from "../../fabric/type/any/arrify.js"
import populateContext from "../utils/populateContext.js"
import makeNewContext from "../utils/makeNewContext.js"
import create from "../create.js"

let layer = layerManager("dialogs")

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
      icon: undefined,
      menubar: undefined,
      footer: undefined,
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
      const clone = structuredClone(this._.ctx.global.store.value)
      this._.parentCtx.global.state.set(this._.parentCtx.scope, clone)
    }
  }

  async cancel() {
    if ("backupData" in this._) {
      const { backupData } = this._
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
      const data = this._.parentCtx.global.store.get(this._.parentCtx.scope)

      ctx = makeNewContext()
      ctx.cancel = this._.parentCtx.cancel.fork()
      populateContext(ctx, { data: structuredClone(data) })

      this._.backupData ??= structuredClone(data)
      this._.ctx = ctx
      if (config.footer === true) {
        config.footer = [
          { type: "button", run: "cancel", label: "Cancel" },
          { type: "button", run: "apply", label: "Apply" },
          { type: "button.btn-default", run: "ok", label: "Ok" },
        ]
      }
    }

    const fragment = document.createDocumentFragment()

    label = arrify(label ?? "")

    if (config.icon) {
      if (typeof config.icon === "string") config.icon = { path: config.icon }
      label.unshift({
        type: "ui-icon",
        small: true,
        label: false,
        ...config.icon,
      })
    }

    if (config.closable) {
      label.push({
        type: "button",
        picto: "close",
        run: "close",
      })
    }

    fragment.append(
      create(
        "header.ui-dialog__header",
        render(label, ctx, undefined, "h2.ui-dialog__title")
      )
    )

    if (config.menubar) {
      fragment.append(
        create(
          "div.ui-dialog__menubar",
          render({ type: "ui-menubar", content: config.menubar }, ctx)
        )
      )
    }

    fragment.append(create("div.ui-dialog__content", render(content, ctx)))

    if (config.footer) {
      fragment.append(
        create("footer.ui-dialog__footer", render(config.footer, ctx))
      )
    }

    root.append(fragment)
  }
}

await Component.define(Dialog)

export default async function dialog(def, ctx, options) {
  layer = await layer

  if (options === undefined) {
    options = ctx ?? {}
    ctx = undefined
  }

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

/* exports
========== */

export async function alert(message = "", options = {}) {
  if (typeof message === "object") {
    options = message
    message = options.message
  }

  await dialog({
    label: options.label ?? "Alert",
    class: "ui-alert" + options.class ? ` ${options.class}` : "",
    content: {
      type: ".box-h.my",
      content: message,
    },
    footer: options.footer ?? [
      { type: "button.btn-default", run: "ok" }, //
    ],
  })
}

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

dialog.alert = alert
dialog.prompt = prompt
