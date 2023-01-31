import FileAgent from "./App/FileAgent.js"
import system from "../../system.js"
import inTop from "../../core/env/realm/inTop.js"
import uid from "../../core/uid.js"
import ui, { UI } from "../../ui.js"
import preinstall from "../preinstall.js"
import getDirname from "../../core/path/core/getDirname.js"
import escapeTemplate from "../../core/formats/template/escapeTemplate.js"
import configure from "../../core/configure.js"
import toKebabCase from "../../fabric/type/string/case/toKebabCase.js"
import noop from "../../fabric/type/function/noop.js"
import editor from "./App/editor.js"
import postrenderAutofocus from "../../ui/postrenderAutofocus.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import template from "../../core/formats/template.js"
import normalizeDecodeTypes from "./App/normalizeDecodeTypes.js"

// TODO: check if rpc functions can be injecteds
import "../../fabric/browser/openInNewTab.js"
import "../../ui/components/dialog.js"
import "../../ui/popup.js"

function getBaseURL(manifestPath) {
  if (manifestPath) {
    return getDirname(new URL(manifestPath, location).href) + "/"
  }

  const url = document.URL
  return url.endsWith("/") ? url : getDirname(url) + "/"
}

async function getIcons(manifestPath) {
  const dir = getDirname(manifestPath)
  const base = getBaseURL(manifestPath)
  const disk = await import("../../core/disk.js") //
    .then(({ disk }) => disk)

  const icons = []

  let icon16
  let icon32
  let icon144

  for (const path of disk.glob([
    `${dir}/icons/**/*.{jpg,gif,svg,png}`,
    `${dir}/icons/*.{jpg,gif,svg,png}`,
    `${dir}/icon*.{jpg,gif,svg,png}`,
  ])) {
    if (path.includes("/16/") || path.includes("-16.")) {
      icon16 = {
        src: new URL(path, base).href,
        sizes: "16x16",
      }
    } else if (path.includes("/32/") || path.includes("-32.")) {
      icon32 = {
        src: new URL(path, base).href,
        sizes: "32x32",
      }
    } else if (path.includes("/144/") || path.includes("-144.")) {
      icon144 = {
        src: new URL(path, base).href,
        sizes: "144x144",
      }
    }
  }

  if (icon16) icons.push(icon16)
  if (icon32) icons.push(icon32)
  if (icon144) icons.push(icon144)

  return icons
}

async function normalizeManifest(manifest, options) {
  if (options?.skipNormalize !== true) {
    if (typeof manifest === "string") {
      const fs = await import("../../core/fs.js") //
        .then((m) => m.default)

      const manifestPath = new URL(manifest, location).pathname

      manifest = await fs.read.json5(manifestPath)
      manifest.manifestPath = manifestPath
    }
  }

  manifest = configure(manifest, options)
  manifest.slug ??= toKebabCase(manifest.name)

  if (manifest.dir === undefined) {
    manifest.dir = getBaseURL(manifest.manifestPath)
  }

  if (inTop) {
    manifest.permissions ??= "app"
    if (manifest.permissions !== "app") {
      throw new Error("TODO: ask user for permissions")
    }
  }

  const [icons] = await Promise.all([
    getIcons(manifest.manifestPath),
    normalizeDecodeTypes(manifest),
  ])

  manifest.icons = icons

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

    path = new URL(path, manifest.dir).href

    if (path.endsWith(".html") || path.endsWith(".php")) {
      path += "?state=" + encodeURIComponent(JSON.stringify(manifest.state))
    }

    out.sandbox.path = path
    return out
  }

  const appScript = manifest.script
    ? `await import("${new URL(manifest.script, manifest.dir).href}")`
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
  let manifest = await normalizeManifest(manifestPath, options)

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
      resolve(manifest, { strict: false, baseURI: manifest.dir })
    )

  return new App(manifest)
}

// Execute App sandboxed inside a dialog
export async function launch(manifestPath, options) {
  const [manifest, /* icons, */ dialog] = await Promise.all([
    normalizeManifest(manifestPath, options),
    // getIcons(manifestPath),
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
