import Component from "../class/Component.js"
import Resource from "../../fabric/class/Resource.js"
import create from "../create.js"
// import ipc from "../../system/ipc.js"

export class Sandbox extends Component {
  static definition = {
    tag: "ui-sandbox",

    tabIndex: 0,

    props: {
      permissions: {
        type: "any",
        fromView: true,
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
        toView: () => "",
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

  setup() {
    const { permissions } = this
    this.resource = new Resource({ permissions })
    this.querySelector(":scope > .ui-sandbox__scene").append(this.resource.el)
  }

  async update() {
    this.cancel()
    this.message()

    if (this.content) {
      const content = {
        content: this.content,
        state: this.ctx.reactive.data,
        scope: this.ctx.globalScope,
      }
      return void this.resource.script(`\
import ui from "/42/ui.js"
ui(${JSON.stringify(content)})`)
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
      // this.channel ??= ipc.to(this.resource.el)
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
