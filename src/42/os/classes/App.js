import system from "../../system.js"
import inTop from "../../core/env/realm/inTop.js"
import uid from "../../core/uid.js"
import UI from "../../ui/classes/UI.js"
import preinstall from "../preinstall.js"
import getDirname from "../../core/path/core/getDirname.js"
import escapeTemplate from "../../core/formats/template/escapeTemplate.js"
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
  }

  if (manifest.dir === undefined) {
    const url = document.URL
    manifest.dir = url.endsWith("/") ? url : getDirname(url) + "/"
  }

  if (inTop) {
    manifest.permissions ??= "app"
    if (manifest.permissions !== "app") {
      throw new Error("TODO: ask user for permissions")
    }
  }

  manifest.state ??= {}

  if (options?.state) merge(manifest.state, options.state)

  return manifest
}

function makeSandbox(manifest, state) {
  if (manifest.path) {
    return {
      permissions: manifest.permissions,
      path: manifest.path,
    }
  }

  const script = escapeTemplate(`\
    import App from "${import.meta.url}"
    globalThis.app = await App.mount(
      ${JSON.stringify(state ?? manifest)},
      { skipNormalize: true }
    )`)

  return {
    permissions: manifest.permissions,
    script,
  }
}

// Execute App sandboxed in a top level page
export async function mount(manifest, options) {
  if (manifest?.$app) {
    const state = manifest
    manifest = state.$app
    manifest.state = state
  }

  manifest = await normalizeManifest(manifest, options)

  if (inTop) {
    const sandbox = makeSandbox(manifest)
    document.title = manifest.name

    // Allow PWA installation
    if (manifest.installable !== false) {
      const install = await preinstall(manifest)
      if (install?.isPending) await install
      else if (install) system.install = install
    }

    return new UI({
      tag: "ui-sandbox.box-fit",
      ...sandbox,
    })
  }

  return new App(manifest)
}

// Execute App sandboxed inside a dialog
export async function launch(manifest, options) {
  manifest = await normalizeManifest(manifest, options)

  const width = manifest.width ?? "400px"
  const height = manifest.height ?? "350px"

  const dialog = await import("../../ui/components/dialog.js") //
    .then((m) => m.default)

  const id = `${manifest.name}_${uid()}`
  manifest.initiator = id

  const state = {
    $dialog: { title: undefined, width, height },
    $app: manifest,
    ...manifest.state,
    ...options?.state,
  }

  const sandbox = makeSandbox(manifest, state)

  return dialog(
    {
      id,
      class: manifest.name,
      label: "{{$app.name}}{{$dialog.title ? ' - ' + $dialog.title : ''}}",
      style: { width: "{{$dialog.width}}", height: "{{$dialog.height}}" },
      content: {
        tag: "ui-sandbox.box-fit" + (manifest.inset ? ".inset" : ""),
        ...sandbox,
      },
      state,
    },
    { id }
  )
}

export default class App extends UI {
  static mount = mount
  static launch = launch

  constructor(manifest) {
    if (manifest.state?.paths) {
      manifest.state.$files = manifest.state.paths.map((path) => ({
        path,
        data: undefined,
        dirty: false,
      }))
    }

    super(
      {
        tag: ".box-fit.box-h",
        content: manifest.menubar
          ? [{ tag: "ui-menubar", content: manifest.menubar }, manifest.content]
          : manifest.content,
        state: manifest.state,
        initiator: manifest.initiator,
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
      },
      { trusted: true }
    )

    this.manifest = manifest

    // this.then(() => {
    //   setTimeout(() => {
    //     this.el.querySelector("#menuItem-newFile").click()
    //   }, 200)
    // })
  }
}
