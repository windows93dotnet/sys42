import { ConfigFile } from "./class/ConfigFile.js"
import parseFilename from "../core/path/parseFilename.js"
import arrify from "../fabric/type/any/arrify.js"
import pick from "../fabric/type/object/pick.js"
import disk from "../core/disk.js"
import getDirname from "../core/path/core/getDirname.js"

// TODO: check if rpc functions can be injecteds
import "../ui/popup.js"
import "../fabric/browser/openInNewTab.js"

const DEFAULTS = {
  defaultApps: {
    mimetypes: {},
    extensions: {},
  },
}

const REGISTRY_KEYS = [
  "name",
  "path",
  "manifest",
  "categories",
  "inset",
  "geometry",
]

const APP_CLASS_URL = new URL("./class/App.js", import.meta.url).pathname

function addMIMETypes({ defaultApps }, name, types) {
  for (const { accept } of types) {
    for (const [mime, exts] of Object.entries(accept)) {
      defaultApps.mimetypes[mime] ??= []
      defaultApps.mimetypes[mime].push(name)
      for (const ext of exts) {
        defaultApps.extensions[ext] ??= []
        defaultApps.extensions[ext].push(name)
      }
    }
  }
}

class AppManager extends ConfigFile {
  async populate() {
    // console.log(disk.glob("**/*.cmd.js"))

    this.value.windows ??= {}

    await Promise.all(
      disk.glob("**/*.app.js").map((manifest) =>
        import(/* @vite-ignore */ manifest).then((m) => {
          const def = m.default
          if (def?.decode?.types) {
            addMIMETypes(this.value, def.name, def.decode.types)
          }

          this.value.windows[def.name] = pick(def, REGISTRY_KEYS)
          this.value.windows[def.name].manifest = manifest
        })
      )
    )
  }

  async lookup(filename) {
    await this.ready

    const { extensions, mimetypes } = this.value.defaultApps
    const out = []
    const { ext, mimetype, mime } = parseFilename(filename)

    if (ext in extensions) out.push(...extensions[ext])
    if (mimetype in mimetypes) out.push(...mimetypes[mimetype])

    const mimeGlob = mime.type + "/*"
    if (mimeGlob in mimetypes) out.push(...mimetypes[mimeGlob])

    return out
  }

  async open(filenames) {
    await this.ready

    const openers = {}

    for (const filename of arrify(filenames)) {
      const [appName] = await this.lookup(filename)

      if (appName === undefined) {
        // appName = "TextEdit"
        console.log("No app available to open this type of file")
        // dialog.alert("No app available to open this type of file")
        // return
        continue
      }

      openers[appName] ??= []
      openers[appName].push(filename)
    }

    for (const [appName, filenames] of Object.entries(openers)) {
      this.exec(appName, filenames)
    }
  }

  async exec(appName, files) {
    await this.ready

    const app = this.value.windows[appName]

    const dir = new URL(getDirname(app.manifest + "/"), location).href + "/"

    files = files.map((path) => ({ path }))

    const dialog = await import("../ui/components/dialog.js") //
      .then((m) => m.default)

    const dialogConfig = { state: { $app: app, $files: files } }

    const sandboxConfig = app.path
      ? { path: app.path }
      : {
          script: `\
import App from "${APP_CLASS_URL}"
import manifest from "${app.manifest}"
manifest.dir = "${dir}"
manifest.state ??= {}
manifest.state.$files = ${JSON.stringify(files)}
globalThis.app = await new App(manifest)
`,
        }

    return dialog({
      label: "{{$app.name}}",
      content: {
        style: { width: "400px", height: "350px" },
        tag: "ui-sandbox" + (app.inset ? ".inset" : ""),
        permissions: "app",
        ...sandboxConfig,
      },
      ...dialogConfig,
    })
  }
}

const apps = new AppManager("apps.cbor", DEFAULTS)
apps.init()

export default apps
