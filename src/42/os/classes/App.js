/* eslint-disable complexity */
import ui, { UI } from "../../ui.js"
import dialog from "../../ui/components/dialog.js"
import postrenderAutofocus from "../../ui/utils/postrenderAutofocus.js"
import transferable from "../../ui/traits/transferable.js"
import system from "../../system.js"

import inTop from "../../core/env/realm/inTop.js"
import uid from "../../core/uid.js"
import template from "../../core/formats/template.js"
import ipc from "../../core/ipc.js"
import fs from "../../core/fs.js"
import escapeTemplate from "../../core/formats/template/escapeTemplate.js"
import configure from "../../core/configure.js"

import noop from "../../fabric/type/function/noop.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import arrify from "../../fabric/type/any/arrify.js"
import Emitter from "../../fabric/classes/Emitter.js"
import resolve from "../../fabric/json/resolve.js"

import editor from "./App/editor.js"
import preinstall from "./App/preinstall.js"
import FileAgent from "./App/FileAgent.js"
import normalizeManifest from "./App/normalizeManifest.js"

// TODO: check if rpc functions can be injecteds
import "../../fabric/browser/openInNewTab.js"
import "../../ui/popup.js"

let DEFAULT_PRELOAD = ""
if (inTop) {
  for (const pathname of [
    new URL(import.meta.url).pathname,
    new URL("./App/FileAgent.js", import.meta.url).pathname,
    new URL("../../core/fs.js", import.meta.url).pathname,
    new URL("../../core/fs/BrowserDriver.js", import.meta.url).pathname,
    new URL("../../fabric/json/resolve.js", import.meta.url).pathname,
    new URL("../../ui/classes/Component.js", import.meta.url).pathname,
    new URL("../../ui/classes/UI.js", import.meta.url).pathname,
    new URL("../../ui/components/menu.js", import.meta.url).pathname,
    new URL("../../ui/components/menubar.js", import.meta.url).pathname,
    new URL("../../ui/traits/transferable.js", import.meta.url).pathname,
    new URL("../../ui.js", import.meta.url).pathname,
  ]) {
    DEFAULT_PRELOAD += `<link rel="modulepreload" href="${pathname}" />\n`
  }
}

async function prepareManifest(manifest, options) {
  manifest ??= new URL("./app.json5", document.URL).pathname

  if (typeof manifest === "string") {
    const manifestPath = new URL(manifest, document.baseURI).pathname
    manifest = await fs.read.json5(manifestPath)
    manifest.manifestPath = manifestPath
  }

  if (options?.skipNormalize !== true) {
    await normalizeManifest(manifest)
  }

  manifest = configure(manifest, options)

  if (inTop) {
    // manifest.permissions ??= "app"
    // if (manifest.permissions !== "app") {
    //   console.warn("TODO: ask user for permissions")
    //   manifest.trusted = true
    // }

    // TODO: set correct permissions
    manifest.permissions ??= "trusted"
    manifest.trusted = true
  }

  manifest.state ??= {}
  manifest.state.$files ??= []

  manifest.background ??= manifest.modules && !manifest.content

  return manifest
}

async function resoleManifest(manifest) {
  manifest.$defs ??= {}
  if (manifest.ui) manifest.$ref = manifest.ui // ui extends the manifest with a javascript file
  Object.assign(manifest.$defs, editor.makeDefs(manifest))
  return resolve(manifest, { strict: false, baseURI: manifest.dirURL })
}

function makeSandbox(manifest) {
  const id = `app__${manifest.slug}--${uid()}`
  manifest.initiator = id
  const { permissions } = manifest

  const out = { id, sandbox: { permissions } }

  if (manifest.document) {
    let path
    const parsed = template.parse(manifest.document)
    if (parsed.substitutions.length > 0) {
      const state = { ...manifest.state }

      for (let i = 0, l = manifest.state.$files.length; i < l; i++) {
        if (!(manifest.state.$files[i] instanceof FileAgent)) {
          state.$files[i] = new FileAgent(manifest.state.$files[i], manifest)
        }
      }

      path = template.format(parsed, state, { delimiter: "/" })
    } else {
      path = manifest.document
    }

    path = new URL(path, manifest.dirURL).href

    out.sandbox.path = path
    return out
  }

  const hasContent = manifest.content || manifest.ui || manifest.$ref
  out.sandbox.head = hasContent ? DEFAULT_PRELOAD : ""

  if (manifest.preload) {
    for (const preload of arrify(manifest.preload)) {
      const { pathname } = new URL(preload, manifest.dirURL)
      out.sandbox.head += `<link rel="modulepreload" href="${pathname}" />\n`
    }
  }

  if (manifest.styles) {
    for (const stylesheet of arrify(manifest.styles)) {
      const { href } = new URL(stylesheet, manifest.dirURL)
      out.sandbox.head += `<link rel="stylesheet" href="${href}" />\n`
    }
  }

  if (manifest.scripts) {
    for (const script of arrify(manifest.scripts)) {
      const { href } = new URL(script, manifest.dirURL)
      out.sandbox.head += `<script src="${href}"></script>\n`
    }
  }

  let appScript = ""

  if (manifest.modules) {
    appScript += `await Promise.all([`

    for (const module of arrify(manifest.modules)) {
      const { href } = new URL(module, manifest.dirURL)
      appScript += `import("${href}"),`
    }

    appScript += `])`
  }

  const script = escapeTemplate(
    manifest.content ||
      manifest.state.$files.length > 0 ||
      Object.keys(manifest.state).length > 1
      ? `\
    import App from "${import.meta.url}"
    window.$manifest = ${JSON.stringify(manifest)}
    window.$app = await App.init(
      window.$manifest,
      { skipNormalize: true }
    )
    window.$files = window.$app.state.$files
    ${appScript}
    $app.start()
    `
      : `\
    window.$manifest = ${JSON.stringify(manifest)}
    ${appScript}
    `,
  )

  out.sandbox.script = script
  return out
}

async function init(manifestPath, options) {
  let manifest = await prepareManifest(manifestPath, options)
  manifest = await resoleManifest(manifest)
  return new App(manifest)
}

async function mount(el, manifestPath, options) {
  let manifest = await prepareManifest(manifestPath, options)
  manifest = await resoleManifest(manifest)
  const app = new App(el ?? true, manifest)
  app.start()
  return app
}

// Execute App sandboxed
async function shell(manifestPath, options) {
  let manifest = await prepareManifest(manifestPath, options)

  if (inTop) {
    const { id, sandbox } = makeSandbox(manifest)
    document.title = manifest.name

    // Allow PWA installation
    if (manifest.installable !== false) {
      const install = await preinstall(manifest)
      if (install?.isPending) await install
    }

    ipc.on("42_APP_READY", async () => system.pwa.files)

    const appShell = new UI(
      { id, tag: "ui-sandbox.app-shell.box-fit", ...sandbox },
      { trusted: manifest.trusted },
    )

    appShell.stage.reactive.watch("/$dialog/title", (val) => {
      if (val) document.title = val
    })

    return appShell
  }

  // Execution is in a sandbox.
  // It's safe to resolve $ref keywords with potential javascript functions
  manifest = await resoleManifest(manifest)

  const app = new App(manifest)
  app.start()
  return app
}

if (inTop) {
  ipc.on("42_APP_LAUNCH", ({ manifestPath, options }) => {
    launch(manifestPath, options)
    // TODO: return an app controller
  })
}

// Execute App sandboxed in a dialog
export async function launch(manifestPath, options) {
  if (!inTop) {
    return ipc.send("42_APP_LAUNCH", { manifestPath, options })
  }

  const manifest = await prepareManifest(manifestPath, options)

  const { id, sandbox } = makeSandbox(manifest)

  if (manifest.background) {
    // background app (without dialog)
    const app = await ui(
      document.documentElement,
      {
        id,
        tag: "ui-sandbox",
        class: `app__${manifest.slug} box-fit transferable-ignore`,
        style: { zIndex: -1 },
        ...sandbox,
      },
      { trusted: manifest.trusted },
    )

    // minimum controller
    return {
      id,
      async close() {
        const { data } = this.stage.reactive
        await app.destroy()
        return data
      },
    }
  }

  let picto
  for (const item of manifest.icons) {
    picto = item.src
    if (item.sizes === "16x16") break
  }

  // // no sandbox experiment
  // const div = document.createElement("div")
  // const app = new App(div, await resoleManifest(manifest))
  // app.start()
  // const content = app.el.firstChild
  // content.classList.add("h-full")

  const content = {
    tag: "ui-sandbox" + (manifest.inset ? ".inset" : ""),
    ...sandbox,
  }

  return dialog(
    configure(
      {
        id,
        class: `app__${manifest.slug}`,
        width: manifest.width ?? 400,
        height: manifest.height ?? 350,
        picto,
      },
      manifest.dialog,
      {
        label: "{{$dialog.title}}",
        content,
        state: {
          $dialog: { title: manifest.name },
        },
      },
    ),
    { trusted: manifest.trusted },
  )
}

export default class App extends UI {
  static init = init
  static mount = mount
  static shell = shell
  static launch = launch

  constructor(el, manifest) {
    if (manifest === undefined) {
      manifest = el
      el = undefined
    }

    manifest.state ??= {}
    manifest.state.$current ??= 0
    manifest.state.$files ??= []
    if (manifest.empty === false && manifest.state.$files.length === 0) {
      manifest.state.$files.push({ name: "untitled" })
    }

    for (let i = 0, l = manifest.state.$files.length; i < l; i++) {
      manifest.state.$files[i] = new FileAgent(
        manifest.state.$files[i],
        manifest,
      )
    }

    let transferableConfig

    if (manifest.decode) {
      const mimetype = []
      for (const type of manifest.decode.types) {
        mimetype.push(...Object.keys(type.accept))
      }

      if (mimetype.length > 0) {
        const transferImport = ({ paths, files, index, isOriginDropzone }) => {
          if (isOriginDropzone) return

          if (!files && !paths) return

          if (manifest.multiple !== true) this.state.$files.length = 0
          index ??= this.state.$files.length

          if (files) {
            this.state.$files.splice(index, 0, ...Object.values(files))
          } else {
            this.state.$files.splice(index, 0, ...paths)
          }

          this.state.$current = index
          return "vanish"
        }

        Object.assign(manifest.$defs.transferableTabs, {
          accept: { mimetype },
          export({ items }) {
            items.details = { paths: [], dataTypes: [] }
            for (const item of items) {
              // TODO: add mimetype initems.details.dataTypes
              items.details.paths.push(item.data.path)
            }
          },
          import: transferImport,
        })

        transferableConfig = {
          items: false,
          findNewIndex: false,
          dropzone: "dim",
          accept: { mimetype },
          import: transferImport,
        }
      }
    }

    if (el) {
      if (el === true) {
        el = document.createElement("div")
        el.className = "item-shrink"
        document.body.prepend(el)
        document.body.classList.add("box-v", "h-screen")
      }

      if (transferableConfig) {
        transferable(document.body, transferableConfig)
      }

      const content = {
        tag: ".box-v.app-content",
        content: manifest.content,
      }

      if (manifest.on) content.on = manifest.on
      if (manifest.watch) content.watch = manifest.watch
      if (manifest.traits) content.traits = manifest.traits

      super(el, {
        tag: ".box-v.app-frame.panel",
        content: manifest.menubar
          ? [{ tag: "ui-menubar", items: manifest.menubar }, content]
          : content,
        state: manifest.state,
        initiator: manifest.initiator,
        actions: manifest.actions,
      })
    } else {
      const content = {
        tag: ".box-v.app-content",
        content: manifest.content,
      }

      if (transferableConfig) content.transferable = transferableConfig

      if (manifest.on) content.on = manifest.on
      if (manifest.watch) content.watch = manifest.watch
      if (manifest.traits) content.traits = manifest.traits

      super({
        tag: ".box-fit.box-v.app-frame.panel",
        content: manifest.menubar
          ? [{ tag: "ui-menubar", items: manifest.menubar }, content]
          : content,
        state: manifest.state,
        initiator: manifest.initiator,
        actions: manifest.actions,
      })
    }

    this.manifest = manifest
    this.emitter = new Emitter()
    const option = { silent: true }

    this.reactive
      .on("prerender", (queue) => {
        for (const [loc, , deleted] of queue) {
          if (!deleted && loc.startsWith("/$files/")) {
            if (loc.lastIndexOf("/") === 7) {
              let $file = this.reactive.get(loc, option)

              if (!($file instanceof FileAgent)) {
                $file = new FileAgent($file, manifest)
                this.reactive.set(loc, $file, option)
              }

              this.emit("decode", $file)
            } else if (loc.endsWith("/path")) {
              this.emit("decode", this.reactive.get(loc.slice(0, -5), option))
            }
          }
        }
      })
      .on("update", (changed) => {
        for (const loc of changed) {
          if (loc.startsWith("/$files/") && loc.lastIndexOf("/") === 7) {
            queueTask(() => postrenderAutofocus(this.el))
            break
          }
        }
      })

    if (!inTop) {
      ipc
        .send("42_APP_READY")
        .then((files) => {
          if (manifest.multiple === true) {
            for (const item of files) this.state.$files.push(item)
          } else {
            this.state.$files.push(files.at(-1))
          }
        })
        .catch(noop)
    }

    editor.init(this)
  }

  async start() {
    await this.ready
    this.manifest.start?.()
    queueTask(() => {
      for (const $file of this.state.$files) {
        this.emit("decode", $file)
      }
    })
  }

  on(events, ...args) {
    if (events.startsWith("/")) return this.reactive.watch(events, args[0])
    return this.emitter.on(events, ...args)
  }

  once(events, ...args) {
    if (events.startsWith("/")) {
      const [fn] = args
      const forget = this.reactive.watch(events, (...args) => {
        fn(...args)
        forget()
      })
      return forget
    }

    return this.emitter.once(events, ...args)
  }

  emit(...args) {
    return this.emitter.emit(...args)
  }

  async send(...args) {
    return this.emitter.send(...args)
  }
}
