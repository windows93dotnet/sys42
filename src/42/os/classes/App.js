import inTop from "../../core/env/realm/inTop.js"
import UI from "../../ui/classes/UI.js"
import preinstall from "../preinstall.js"
import getDirname from "../../core/path/core/getDirname.js"

// TODO: check if rpc functions can be injecteds
import "../../fabric/browser/openInNewTab.js"
import "../../ui/components/dialog.js"
import "../../ui/popup.js"

function normalizeManifest(manifest) {
  if (manifest.dir === undefined) {
    const url = document.URL
    manifest.dir = url.endsWith("/") ? url : getDirname(url) + "/"
  }

  return manifest
}

export default class App extends UI {
  constructor(manifest) {
    super({
      tag: ".box-fit.box-h",
      content: manifest.menubar
        ? [{ tag: "ui-menubar", content: manifest.menubar }, manifest.content]
        : manifest.content,
      state: {},
      actions: {
        io: {
          new() {
            console.log("new")
          },
          open() {
            console.log("open")
          },
          save() {
            console.log("save")
          },
        },
      },
    })
    this.manifest = manifest
  }

  static async mount(manifest, options) {
    if (options?.skipNormalize !== true) {
      if (typeof manifest === "string") {
        const fs = await import("../../core/fs.js") //
          .then((m) => m.default)

        manifest = await fs.read.json5(new URL(manifest, location).pathname)
      }

      manifest = normalizeManifest(manifest)
    }

    const script = `\
    import App from "${import.meta.url}"
    globalThis.app = await App.mount(
      ${JSON.stringify(manifest)},
      { skipNormalize: true }
    )`

    if (inTop) {
      const permissions = manifest.permissions ?? "app"

      if (permissions !== "app") {
        console.log("ask for permissions")
      }

      const sandboxedApp = await new UI({
        tag: "ui-sandbox.box-fit",
        permissions,
      })
      sandboxedApp.content.script = script // TODO: find other way to avoid unwanted template locals resolution
    }

    const install = await preinstall(manifest)

    if (install === true) return

    return new App(manifest)
  }
}
