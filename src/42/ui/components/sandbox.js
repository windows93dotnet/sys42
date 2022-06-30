import Component from "../class/Component.js"
import Resource from "../../fabric/class/Resource.js"
import create from "../create.js"
// import ipc from "../../system/ipc.js"

export class Sandbox extends Component {
  static definition = {
    tag: "ui-sandbox",

    tabIndex: 0,

    props: {
      src: {
        type: "string",
        fromView: true,
        update: true,
      },
      srcdoc: {
        type: "string",
        fromView: true,
        update: true,
      },
      permissions: {
        type: "any",
        fromView: true,
        // update: true, // TODO: allow permissions update
      },
      content: {
        type: "any",
        update: true,
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
    this.srcdoc = undefined
    this.src = url
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
        data: this.ctx.state.value,
        scope: this.ctx.stateScope,
      }
      return void this.resource.module(`\
import ui from "/42/ui.js"
ui(${JSON.stringify(content)})`)
    }

    if (this.srcdoc) {
      return void this.resource.srcdoc(this.srcdoc)
    }

    if (!this.src) return

    this.toggleAttribute("loading", true)
    this.message("loading...")

    this.#cancel = this.ctx.cancel.fork()
    const { signal } = this.#cancel

    this.resource.config.checkIframable = this.check

    try {
      await this.resource.go(this.src, { signal })
      // this.channel ??= ipc.to(this.resource.el)
      this.message()
    } catch {
      this.message(
        create("div", "Impossible to embed this URL"),
        create("a", { href: this.src, target: "_blank" }, this.src)
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
