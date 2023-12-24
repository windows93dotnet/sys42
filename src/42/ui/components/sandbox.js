import system from "../../system.js"
import Component from "../classes/Component.js"
import Resource from "../../fabric/classes/Resource.js"
import create from "../create.js"
import defer from "../../fabric/type/promise/defer.js"
import { forkPlan } from "../normalize.js"
import SecurityError from "../../fabric/errors/SecurityError.js"

const _setResource = Symbol("setResource")

const { href: ipcUrl } = new URL("../../core/ipc.js", import.meta.url)
const { href: uiUrl } = new URL("../../ui.js", import.meta.url)
const { href: headUrl } = new URL("../head.js", import.meta.url)

const DEFAULTS = {
  head: /* html */ `
    <link rel="stylesheet" href="/style.css" id="theme" />
    <script type="module" src="${headUrl}"></script>
  `,
  body: /* html */ `<body class="in-iframe">`,
}

async function makeVhost(origin) {
  const [fileIndex, ipc, fs] = await Promise.all([
    import("../../core/fileIndex.js").then(({ fileIndex }) => fileIndex),
    import("../../core/ipc.js").then(({ ipc }) => ipc),
    import("../../core/fs.js").then(({ fs }) => fs),
  ])

  ipc.from(origin).on("42_VHOST_REQ", async (path) => fs.open(path))
  await fileIndex.ready
}

if (system.network?.vhost) {
  const vhostOrigin = new URL(system.network.vhost).origin
  if (vhostOrigin === location.origin) {
    // Unsafe to use vhost if from same origin
    delete system.network.vhost
  } else {
    system.network.vhostOrigin = vhostOrigin
    makeVhost(system.network.vhostOrigin)
  }
}

export class Sandbox extends Component {
  static plan = {
    tag: "ui-sandbox",

    id: true,

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
      head: {
        type: "string",
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
    this.resource = new Resource({ permissions })

    const { sandbox } = this.resource.el

    if (
      this.stage.trusted !== true &&
      permissions !== "web" &&
      sandbox.contains("allow-scripts") &&
      sandbox.contains("allow-same-origin")
    ) {
      throw new SecurityError(
        '"scripts" and "same-origin" permissions are forbiden in untrusted context',
      )
    }

    this.querySelector(":scope > .ui-sandbox__scene") //
      .replaceChildren(this.resource.el)
  }

  async update() {
    if (!this.resource) this[_setResource]()
    this.cancel()
    this.message()

    const head = DEFAULTS.head + (this.head ?? "")
    const { body } = DEFAULTS
    const options = { head, body }

    if (this.content) {
      const content = forkPlan(this.content, this.stage)
      const id = `sandboxed-${this.id}`

      if (!this.stage.sandboxes.has(id)) {
        const deferred = defer({ timeout: 2000 })
        this.stage.waitlistPending.push(deferred)
        this.stage.sandboxes.set(id, deferred)
      }

      content.plugins ??= []
      if (!content.plugins.includes("ipc")) content.plugins.push("ipc")

      const script = `
        import ipc from "${ipcUrl}";
        import ui from "${uiUrl}";
        const app = await ui(${JSON.stringify(content)}, {id:"${id}"});
        window.app = app;
        ${this.script ?? ""}`

      // Ensure sandboxed content can execute rpc/ipc functions in top
      await Promise.all([
        import("./dialog.js"),
        import("../popup.js"),
        import("../traits/transferable.js"),
      ])
      return this.resource.script(script, options)
    }

    if (this.script) {
      const script =
        this.script.includes("ipc.") && !this.script.includes("ipc.js")
          ? `import ipc from "${ipcUrl}";\n${this.script}`
          : this.script

      return this.resource.script(script, options)
    }

    if (this.html) return this.resource.html(this.html, options)

    if (!this.path) return

    this.toggleAttribute("loading", true)

    this.#cancel = this.stage.cancel.fork()
    const { signal } = this.#cancel

    this.resource.config.checkIframable = this.check

    let { path } = this

    if (system.network?.vhostOrigin && path.endsWith(".html")) {
      const url = new URL(path, location)
      if (url.origin === location.origin) {
        this.resource.el.sandbox.add("allow-same-origin")
        path = `${system.network.vhost}?path=${url.pathname}&origin=${location.origin}`
      }
    }

    try {
      await this.resource.go(path, { signal })
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
          this.path,
        ),
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
