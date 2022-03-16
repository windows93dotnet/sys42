import Component from "../class/Component.js"
import Resource from "../../fabric/class/Resource.js"
import create from "../create.js"
import ipc from "../../system/ipc.js"

export class Enclose extends Component {
  static definition = {
    tag: "ui-enclose",
    tabIndex: 0,
    properties: {
      src: {
        type: "string",
        fromView: true,
        render: true,
      },
      permissions: {
        type: "any",
        fromView: true,
        render: true,
      },
      zoom: {
        type: "number",
        fromView: true,
        css: true,
        default: 100,
      },
      check: {
        type: "boolean",
        fromView: true,
        default: false,
      },
    },
  }

  #cancel = undefined

  cancel() {
    this.#cancel?.()
  }

  go(url) {
    this.src = url
  }

  unload(message = "loading...") {
    const { view } = this._
    view.message.replaceChildren(message)
  }

  $create({ root, view }) {
    const { permissions } = this
    this.resource = new Resource({ permissions })
    view.message = create("div.ui-enclose__message")
    view.scene = create("div.ui-enclose__scene")

    view.scene.append(this.resource.el)

    root.append(view.scene, view.message)
    this.unload()
  }

  async $render({ view, ctx }) {
    this.cancel()

    if (!this.src) return this.unload("")

    view.message.replaceChildren()

    this.#cancel = ctx.cancel.fork()
    const { signal } = this.#cancel

    this.resource.config.checkIframable = this.check

    try {
      await this.resource.go(this.src, { signal })
      this.channel?.destroy()
      this.channel = ipc.to(this.resource.el)
    } catch {
      view.message.replaceChildren(
        create("div", "Impossible to embed this URL"),
        create("a", { href: this.src, target: "_blank" }, this.src)
      )
    }
  }
}

export default await Component.define(Enclose)
