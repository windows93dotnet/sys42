import Component from "../class/Component.js"
import Resource from "../../fabric/class/Resource.js"
import create from "../create.js"
import traverse from "../../fabric/type/object/traverse.js"
import { forkDef } from "../normalize.js"

const _setResource = Symbol("setResource")

export class Sandbox extends Component {
  static definition = {
    tag: "ui-sandbox",

    tabIndex: 0,

    props: {
      permissions: {
        type: "any",
        fromView: true,
        update: _setResource,
      },
      path: {
        type: "string",
        fromView: true,
        update: true,
      },
      document: {
        type: "string",
        fromView: true,
        update: true,
      },
      content: {
        type: "any",
        fromView: true,
        update: true,
      },
      html: {
        type: "string",
        fromView: true,
        update: true,
      },
      script: {
        type: "string",
        fromView: true,
        update: true,
        toView(key, val, el) {
          return !el.content
        },
      },
      zoom: {
        type: "number",
        fromView: true,
        css: true,
        default: 1,
      },
      check: {
        type: "boolean",
        fromView: true,
        default: false,
      },
    },

    plugins: ["ipc"],

    content: [
      { tag: ".ui-sandbox__scene" }, //
      { tag: ".ui-sandbox__message" },
    ],
  }

  #cancel = undefined

  cancel() {
    this.#cancel?.()
  }

  go(url) {
    this.content = undefined
    this.script = undefined
    this.html = undefined
    this.document = undefined
    this.path = url
  }

  message(...args) {
    this.querySelector(":scope > .ui-sandbox__message").replaceChildren(...args)
  }

  [_setResource](init) {
    if (init) return
    const { permissions } = this
    this.resource = new Resource({ permissions })

    const { sandbox } = this.resource.el
    if (
      this.ctx.trusted !== true &&
      sandbox.contains("allow-scripts") &&
      sandbox.contains("allow-same-origin")
    ) {
      throw new DOMException(
        '"scripts" and "same-origin" permissions are forbiden in untrusted context',
        "SecurityError"
      )
    }

    this.querySelector(":scope > .ui-sandbox__scene") //
      .replaceChildren(this.resource.el)
  }

  async update() {
    if (!this.resource) this[_setResource]()
    this.cancel()
    this.message()

    if (this.content) {
      const content = forkDef(this.content, this.ctx)
      content.plugins = ["ipc"]
      const undones = []
      traverse(this.content, (key) => {
        // Ensure realmed components can exectute function in top
        if (key === "dialog") undones.push(import("./dialog.js"))
      })
      await Promise.all(undones)
      return void this.resource.script(`\
import ui from "/42/ui.js"
const app = await ui(${JSON.stringify(content)})
${this.script ?? ""}
`)
    }

    if (this.script) return void this.resource.script(this.script)
    if (this.html) return void this.resource.html(this.html)
    if (this.document) return void this.resource.document(this.document)
    if (!this.path) return

    this.toggleAttribute("loading", true)
    this.message("loading...")

    this.#cancel = this.ctx.cancel.fork()
    const { signal } = this.#cancel

    this.resource.config.checkIframable = this.check

    try {
      await this.resource.go(this.path, { signal })
      this.message()
    } catch {
      this.message(
        create("div", "Impossible to embed this URL"),
        create("a", { href: this.path, target: "_blank" }, this.path)
      )
    }

    this.removeAttribute("loading")
  }

  destroy() {
    this.#cancel?.()
    this.channel?.destroy()
  }
}

export default Component.define(Sandbox)
