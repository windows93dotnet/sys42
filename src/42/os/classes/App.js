import system from "../../system.js"
import inTop from "../../core/env/realm/inTop.js"
import uid from "../../core/uid.js"
import UI from "../../ui/classes/UI.js"
import preinstall from "../preinstall.js"
import getDirname from "../../core/path/core/getDirname.js"
import escapeTemplate from "../../core/formats/template/escapeTemplate.js"
import configure from "../../core/configure.js"
// import resolve from "../../fabric/json/resolve.js"

// TODO: check if rpc functions can be injecteds
import "../../fabric/browser/openInNewTab.js"
import "../../ui/components/dialog.js"
import "../../ui/popup.js"

async function normalizeManifest(manifest, options) {
  if (options?.skipNormalize !== true) {
    if (typeof manifest === "string") {
      const fs = await import("../../core/fs.js") //
        .then((m) => m.default)

      const manifestPath = manifest

      manifest = await fs.read.json5(new URL(manifest, location).pathname)
      manifest.manifestPath = manifestPath
    }
  }

  manifest = configure(manifest, options)

  if (manifest.dir === undefined) {
    if (manifest.manifestPath) {
      manifest.dir =
        getDirname(new URL(manifest.manifestPath, location).href) + "/"
    } else {
      const url = document.URL
      manifest.dir = url.endsWith("/") ? url : getDirname(url) + "/"
    }
  }

  if (inTop) {
    manifest.permissions ??= "app"
    if (manifest.permissions !== "app") {
      throw new Error("TODO: ask user for permissions")
    }
  }

  manifest.state ??= {}
  manifest.state.$files ??= []
  manifest.state.$files = manifest.state.$files.map((item) => {
    if (typeof item === "string") {
      return {
        path: item,
        data: undefined,
        dirty: false,
      }
    }

    return item
  })

  return manifest
}

function makeSandbox(manifest) {
  const id = `${manifest.name}_${uid()}`
  manifest.initiator = id
  const { permissions } = manifest

  const out = { id, sandbox: { permissions } }

  if (manifest.path) {
    let path = new URL(manifest.path, manifest.dir).href

    if (path.endsWith(".html") || path.endsWith(".php")) {
      path += "?state=" + encodeURIComponent(JSON.stringify(manifest.state))
    }

    out.sandbox.path = path
    return out
  }

  const script = escapeTemplate(`\
    import App from "${import.meta.url}"
    globalThis.app = await App.mount(
      ${JSON.stringify(manifest)},
      { skipNormalize: true }
    )`)

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
        ipc.on("42_IO_READY", async () => system.pwa.files)
      })

    const appShell = new UI({
      id,
      tag: "ui-sandbox.box-fit",
      ...sandbox,
    })

    appShell.ctx.reactive.watch("/$dialog/title", (val) => {
      if (val) document.title = val
    })

    return appShell
  }

  // Execution is in a sandbox.
  // It's safe to resolve $ref keywords with potential javascript functions
  manifest = await import("../../fabric/json/resolve.js") //
    .then(({ resolve }) =>
      resolve(manifest, { strict: false, baseURL: manifest.dir })
    )

  return new App(manifest)
}

// Execute App sandboxed inside a dialog
export async function launch(manifestPath, options) {
  const manifest = await normalizeManifest(manifestPath, options)

  const width = `${manifest.width ?? "400"}px`
  const height = `${manifest.height ?? "350"}px`

  const dialog = await import("../../ui/components/dialog.js") //
    .then((m) => m.default)

  const { id, sandbox } = makeSandbox(manifest)

  return dialog({
    id,
    class: manifest.name,
    style: { width, height },
    label: "{{$dialog.title}}",
    content: {
      tag: "ui-sandbox.box-fit" + (manifest.inset ? ".inset" : ""),
      ...sandbox,
    },
    state: {
      $dialog: { title: manifest.name },
      // $files: manifest.state.$files,
    },
  })
}

export default class App extends UI {
  static mount = mount
  static launch = launch

  constructor(manifest) {
    manifest.state ??= {}
    manifest.state.$files ??= []

    super({
      tag: ".box-fit.box-h",
      content: manifest.menubar
        ? [{ tag: "ui-menubar", content: manifest.menubar }, manifest.content]
        : manifest.content,
      state: manifest.state,
      initiator: manifest.initiator,
      // actions: {
      //   editor: {
      //     newFile() {
      //       console.log("newFile")
      //       this.state.$files[0] = {
      //         path: undefined,
      //         data: undefined,
      //         dirty: false,
      //       }
      //     },
      //     saveFile() {
      //       console.log("saveFile", this.state.$files[0].data)
      //     },
      //     openFile() {
      //       console.log("openFile")
      //     },
      //   },
      // },
    })

    this.manifest = manifest

    import("../../core/fs.js").then(({ default: fs }) => {
      for (const item of this.state.$files) {
        if (!item.data) {
          fs.open(item.path).then((data) => {
            item.data = data
            item.url = URL.createObjectURL(data)
          })
        }
      }
    })

    import("../../io.js").then(({ default: io }) => {
      io.listenImport()
      io.on("import", ([{ id, file }]) => {
        this.state.$files[0] = {
          id,
          path: file.name,
          data: file,
          dirty: false,
        }
      })
      io.on("paths", ([path]) => {
        this.state.$files[0] = {
          path,
          data: undefined,
          dirty: false,
        }
      })
    })
  }
}
