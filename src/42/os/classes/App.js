import inTop from "../../core/env/realm/inTop.js"
import UI from "../../ui/classes/UI.js"
import preinstall from "../preinstall.js"
import getDirname from "../../core/path/core/getDirname.js"
// import escapeTemplate from "../../core/formats/template/escapeTemplate.js"
import merge from "../../fabric/type/object/merge.js"

// TODO: check if rpc functions can be injecteds
import "../../fabric/browser/openInNewTab.js"
import "../../ui/components/dialog.js"
import "../../ui/popup.js"

async function normalizeManifest(manifest, options) {
  if (options?.skipNormalize !== true) {
    if (typeof manifest === "string") {
      const fs = await import("../../core/fs.js") //
        .then((m) => m.default)

      manifest = await fs.read.json5(new URL(manifest, location).pathname)
    }

    if (manifest.dir === undefined) {
      const url = document.URL
      manifest.dir = url.endsWith("/") ? url : getDirname(url) + "/"
    }
  }

  if (inTop) {
    manifest.permissions ??= "app"
    if (manifest.permissions !== "app") {
      console.log("TODO: ask user for permissions")
    }
  }

  manifest.state ??= {}

  if (options?.state) merge(manifest.state, options.state)

  return manifest
}

// function makeSandbox(manifest) {
//   if (manifest.path) {
//     return {
//       permissions: manifest.permissions,
//       path: manifest.path,
//     }
//   }

//   const script = escapeTemplate(`\
//     import App from "${import.meta.url}"
//     globalThis.app = await App.mount(
//       ${JSON.stringify(manifest)},
//       { skipNormalize: true }
//     )`)

//   return {
//     permissions: manifest.permissions,
//     script,
//   }
// }

function makeSandbox(manifest) {
  return {
    permissions: manifest.permissions,
    content: {
      tag: ".box-fit.box-h",
      content: manifest.menubar
        ? [{ tag: "ui-menubar", content: manifest.menubar }, manifest.content]
        : manifest.content,
    },
  }
}

// Execute App sandboxed in a top level page
export async function mount(manifest, options) {
  manifest = await normalizeManifest(manifest, options)
  const sandbox = makeSandbox(manifest)

  if (inTop) {
    return new UI({
      tag: "ui-sandbox.box-fit",
      ...sandbox,
    })
  }

  // Allow PWA installation
  if (manifest.installable !== false) {
    const install = await preinstall(manifest)
    if (install === true) return
  }

  return new App(manifest)
}

// Execute App sandboxed inside a dialog
export async function launch(manifest, options) {
  manifest = await normalizeManifest(manifest, options)
  const sandbox = makeSandbox(manifest)

  const width = manifest.width ?? "400px"
  const height = manifest.height ?? "350px"

  const dialog = await import("../../ui/components/dialog.js") //
    .then((m) => m.default)

  return dialog({
    label: "{{$app.name}}{{$dialog.title ? ' - ' + $dialog.title : ''}}",
    style: { width: "{{$dialog.width}}", height: "{{$dialog.height}}" },
    content: {
      tag: "ui-sandbox.box-fit" + (manifest.inset ? ".inset" : ""),
      ...sandbox,
    },
    actions: {
      editor: {
        newFile() {
          console.log("newFile")
          this.state.$files[0].data = undefined
          this.state.$files[0].dirty = undefined
          this.state.$files[0].path = undefined
        },
        saveFile() {
          console.log("saveFile", this.state.$files[0].data)
        },
        openFile() {
          console.log("openFile")
        },
      },
    },
    state: {
      $dialog: { title: undefined, width, height },
      $app: manifest,
      $files: options?.state?.paths.map((path) => ({ path })),
      ...manifest.state,
      ...options?.state,
    },
  })
}

export default class App extends UI {
  static mount = mount
  static launch = launch

  constructor(manifest) {
    if (manifest.state?.paths) {
      manifest.state.$files = manifest.state.paths.map((path) => ({ path }))
    }

    super(
      {
        tag: ".box-fit.box-h",
        content: manifest.menubar
          ? [{ tag: "ui-menubar", content: manifest.menubar }, manifest.content]
          : manifest.content,
        state: manifest.state,
        actions: {
          io: {
            newFile() {
              this.state.$files[0].data = undefined
              this.state.$files[0].dirty = undefined
              this.state.$files[0].path = undefined
            },
            saveFile() {
              console.log(888, this.state.$files[0].data)
            },
          },
        },
      },
      { trusted: true }
    )

    this.manifest = manifest

    this.then(() => {
      setTimeout(() => {
        this.el.querySelector("#menuItem-newFile").click()
      }, 200)
    })
  }
}
