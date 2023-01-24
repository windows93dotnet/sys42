import Component from "../classes/Component.js"
import Resource from "../../fabric/classes/Resource.js"
import create from "../create.js"
import traverse from "../../fabric/type/object/traverse.js"
import { forkPlan } from "../normalize.js"
import setTemp from "../../fabric/dom/setTemp.js"
import listen from "../../fabric/event/listen.js"
// import ipc from "../../core/ipc.js"
// import dataTransfertImport from "../../core/dt/dataTransfertImport.js"

const _setResource = Symbol("setResource")

const { href: ipcUrl } = new URL("../../core/ipc.js", import.meta.url)
const { href: uiUrl } = new URL("../../ui.js", import.meta.url)
const { href: headUrl } = new URL("../head.js", import.meta.url)

const options = {
  head: /* html */ `
    <link rel="stylesheet" href="/style.css" id="theme" />
    <script type="module" src="${headUrl}"></script>
  `,
  body: /* html */ `<body class="in-iframe">`,
}

// Chrome don't allow drag from top to iframe
// or dropping folder into sandboxed iframe
// https://bugs.chromium.org/p/chromium/issues/detail?id=251718
let restore
listen({
  "dragstart || dragover"() {
    restore ??= setTemp(document.documentElement, {
      class: { "pointerless-iframes": true },
    })
  },
  "dragend"() {
    restore?.()
    restore = undefined
  },
})

export class Sandbox extends Component {
  static plan = {
    tag: "ui-sandbox",

    tabIndex: -1,

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
      { tag: ".ui-sandbox__scene.zoom" }, //
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

  get bus() {
    return this.resource?.bus
  }

  [_setResource](init) {
    if (init) return
    const { permissions } = this
    // const { signal } = this.stage
    // this.resource = new Resource({ permissions, signal })
    this.resource = new Resource({ permissions })

    const { sandbox } = this.resource.el
    if (
      this.stage.trusted !== true &&
      permissions !== "web" &&
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
      const undones = []
      traverse(this.content, (key) => {
        // Ensure sandboxed content can execute rpc functions in top
        if (key === "dialog") undones.push(import("./dialog.js"))
        if (key === "popup") undones.push(import("../popup.js"))
      })
      await Promise.all(undones)
      const content = forkPlan(this.content, this.stage)
      content.plugins ??= []
      if (!content.plugins.includes("ipc")) content.plugins.push("ipc")

      const script = `
        import ipc from "${ipcUrl}";
        import ui from "${uiUrl}";
        const app = await ui(${JSON.stringify(content)});
        ${this.script ?? ""}`

      return this.resource.script(script, options)
    }

    if (this.script) return this.resource.script(this.script, options)
    if (this.html) return this.resource.html(this.html, options)
    if (!this.path) return

    this.toggleAttribute("loading", true)
    this.message("loading...")

    this.#cancel = this.stage.cancel.fork()
    const { signal } = this.#cancel

    this.resource.config.checkIframable = this.check

    try {
      await this.resource.go(this.path, { signal })
      this.message()
    } catch {
      this.message(
        create("div", "Impossible to embed this URL"),
        create(
          "a",
          {
            href: this.path,
            target: "_blank",
            rel: "nofollow noreferrer",
          },
          this.path
        )
      )
    }

    this.removeAttribute("loading")
  }

  destroy() {
    this.#cancel?.()
    this.resource?.destroy()
  }
}

export default Component.define(Sandbox)
