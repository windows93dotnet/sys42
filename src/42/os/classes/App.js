import system from "../../system.js"
import inTop from "../../core/env/realm/inTop.js"
import uid from "../../core/uid.js"
import ui, { UI } from "../../ui.js"
import escapeTemplate from "../../core/formats/template/escapeTemplate.js"
import configure from "../../core/configure.js"
import noop from "../../fabric/type/function/noop.js"
import postrenderAutofocus from "../../ui/postrenderAutofocus.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import template from "../../core/formats/template.js"

import editor from "./App/editor.js"
import preinstall from "./App/preinstall.js"
import FileAgent from "./App/FileAgent.js"
import normalizeManifest, { getIcons } from "./App/normalizeManifest.js"

// TODO: check if rpc functions can be injecteds
import "../../fabric/browser/openInNewTab.js"
import "../../ui/components/dialog.js"
import "../../ui/popup.js"

async function prepareManifest(manifest, options) {
  if (options?.skipNormalize !== true) {
    if (manifest === undefined) {
      const disk = await import("../../core/disk.js") //
        .then((m) => m.default)
      const dirPath = new URL(document.URL).pathname
      const dir = disk.get(dirPath)
      for (const key of Object.keys(dir)) {
        if (key.endsWith(".app.json5")) {
          manifest = dirPath + key
          break
        }
      }
    }

    if (typeof manifest === "string") {
      const fs = await import("../../core/fs.js") //
        .then((m) => m.default)

      const manifestPath = new URL(manifest, location).pathname

      manifest = await fs.read.json5(manifestPath)
      manifest.manifestPath = manifestPath
    }

    await normalizeManifest(manifest)
  }

  manifest = configure(manifest, options)

  if (inTop) {
    manifest.permissions ??= "app"
    if (manifest.permissions !== "app") {
      throw new Error("TODO: ask user for permissions")
    }
  }

  manifest.state ??= {}
  manifest.state.$files ??= []

  return manifest
}

function makeSandbox(manifest) {
  const id = `app__${manifest.slug}--${uid()}`
  manifest.initiator = id
  const { permissions } = manifest

  const out = { id, sandbox: { permissions } }

  if (manifest.path) {
    let path
    const parsed = template.parse(manifest.path)
    if (parsed.substitutions.length > 0) {
      const state = { ...manifest.state, foo: "hello" }

      for (let i = 0, l = manifest.state.$files.length; i < l; i++) {
        if (!(manifest.state.$files[i] instanceof FileAgent)) {
          state.$files[i] = new FileAgent(manifest.state.$files[i], manifest)
        }
      }

      path = template.format(parsed, state, { delimiter: "/" })
    } else {
      path = manifest.path
    }

    path = new URL(path, manifest.dirURL).href

    if (path.endsWith(".html") || path.endsWith(".php")) {
      path += "?state=" + encodeURIComponent(JSON.stringify(manifest.state))
    }

    out.sandbox.path = path
    return out
  }

  const appScript = manifest.script
    ? `await import("${new URL(manifest.script, manifest.dirURL).href}")`
    : ""

  const script = escapeTemplate(
    manifest.script && !manifest.content
      ? `\
    globalThis.$manifest = ${JSON.stringify(manifest)}
    ${appScript}
    `
      : `\
    import App from "${import.meta.url}"
    globalThis.$manifest = ${JSON.stringify(manifest)}
    globalThis.$app = await App.mount(
      globalThis.$manifest,
      { skipNormalize: true }
    )
    globalThis.$files = globalThis.$app.state.$files
    globalThis.$main?.(globalThis.$app)
    ${appScript}
    `
  )

  out.sandbox.script = script
  return out
}

// Execute App sandboxed in a top level page
export async function mount(manifestPath, options) {
  let manifest = await prepareManifest(manifestPath, options)

  if (inTop) {
    const { id, sandbox } = makeSandbox(manifest)
    document.title = manifest.name

    // Allow PWA installation
    if (manifest.installable !== false) {
      const install = await preinstall(manifest)
      if (install?.isPending) await install
    }

    import("../../core/ipc.js") //
      .then(({ ipc }) => {
        ipc.on("42_APP_READY", async () => system.pwa.files)
      })

    const appShell = new UI({ id, tag: "ui-sandbox.box-fit", ...sandbox })

    appShell.stage.reactive.watch("/$dialog/title", (val) => {
      if (val) document.title = val
    })

    return appShell
  }

  // manifest.$id = new URL(manifest.manifestPath, manifest.dir).href
  manifest.$defs ??= {}
  Object.assign(manifest.$defs, editor.menubar)

  // Execution is in a sandbox.
  // It's safe to resolve $ref keywords with potential javascript functions
  manifest = await import("../../fabric/json/resolve.js") //
    .then(({ resolve }) =>
      resolve(manifest, { strict: false, baseURI: manifest.dirURL })
    )

  return new App(manifest)
}

// Execute App sandboxed inside a dialog
export async function launch(manifestPath, options) {
  const [manifest, dialog] = await Promise.all([
    prepareManifest(manifestPath, options),
    await import("../../ui/components/dialog.js") //
      .then((m) => m.default),
  ])

  const { id, sandbox } = makeSandbox(manifest)
  if (manifest.script && !manifest.content) {
    ui(document.documentElement, {
      id,
      tag: `ui-sandbox`,
      class: `app__${manifest.slug} box-fit`,
      style: { zIndex: -1 },
      ...sandbox,
    })
    return
  }

  const width = `${manifest.width ?? "400"}px`
  const height = `${manifest.height ?? "350"}px`

  let picto
  for (const item of manifest.icons) {
    if (item.sizes === "16x16") {
      picto = item.src
      break
    }

    picto = item.src
  }

  return dialog({
    id,
    class: `app__${manifest.slug}`,
    style: { width, height },
    picto,
    label: "{{$dialog.title}}",
    content: {
      tag: "ui-sandbox" + (manifest.inset ? ".inset" : ""),
      ...sandbox,
    },
    state: {
      $dialog: { title: manifest.name },
    },
  })
}

export default class App extends UI {
  static mount = mount
  static launch = launch
  static getIcons = getIcons

  constructor(manifest) {
    manifest.state ??= {}
    manifest.state.$current ??= 0
    manifest.state.$files ??= []
    if (manifest.empty === false && manifest.state.$files.length === 0) {
      manifest.state.$files.push({ name: "untitled" })
    }

    for (let i = 0, l = manifest.state.$files.length; i < l; i++) {
      manifest.state.$files[i] = new FileAgent(
        manifest.state.$files[i],
        manifest
      )
    }

    const content = {
      tag: ".box-v",
      content: manifest.content,
      transferable: {
        items: false,
        findNewIndex: false,
        dropzone: "arrow",
        accept: "$file",
        import: ({ paths, index }) => {
          if (manifest.multiple !== true) this.state.$files.length = 0
          index ??= this.state.$files.length
          this.state.$files.splice(index, 0, ...paths)
          this.state.$current = index
          return "vanish"
        },
      },
    }

    if (manifest.on) content.on = manifest.on
    if (manifest.watch) content.watch = manifest.watch
    if (manifest.traits) content.traits = manifest.traits

    super({
      tag: ".box-fit.box-v.panel",
      content: manifest.menubar
        ? [{ tag: "ui-menubar", content: manifest.menubar }, content]
        : content,
      state: manifest.state,
      initiator: manifest.initiator,
    })

    this.manifest = manifest

    const option = { silent: true }

    this.reactive
      .on("prerender", (queue) => {
        for (const [loc, , deleted] of queue) {
          if (
            !deleted &&
            loc.startsWith("/$files/") &&
            loc.lastIndexOf("/") === 7
          ) {
            const $file = this.reactive.get(loc)
            if (!($file instanceof FileAgent)) {
              this.reactive.set(loc, new FileAgent($file, manifest), option)
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
      import("../../core/ipc.js").then(({ ipc }) => {
        ipc
          .send("42_APP_READY")
          .then((files) => {
            for (const item of files) this.state.$files.push(item)
          })
          .catch(noop)
      })
    }

    editor.init(this)
  }
}
