import { ConfigFile } from "./class/ConfigFile.js"
import parseFilename from "../fabric/type/path/parseFilename.js"
import disk from "../system/fs/disk.js"
import dirname from "../fabric/type/path/extract/dirname.js"

const DEFAULTS = {
  defaultApps: {
    mimetypes: {},
    extensions: {},
  },
}

let dialog

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

    this.value.dialogs ??= {}

    await Promise.all(
      disk.glob("**/*.app.js").map((path) =>
        import(/* @vite-ignore */ path).then((m) => {
          const def = m.default
          if (def?.decode?.types) {
            addMIMETypes(this.value, def.name, def.decode.types)
          }

          const { categories, geometry } = def
          if (def.path) path = def.path
          this.value.dialogs[def.name] = { path, categories, geometry }
        })
      )
    )

    // console.log(this.value)
  }

  lookup(filename) {
    const { extensions, mimetypes } = this.value.defaultApps
    const out = []
    const { ext, mimetype, mime } = parseFilename(filename)

    if (ext in extensions) out.push(...extensions[ext])
    if (mimetype in mimetypes) out.push(...mimetypes[mimetype])

    const mimeGlob = mime.type + "/*"
    if (mimeGlob in mimetypes) out.push(...mimetypes[mimeGlob])

    return out
  }

  async open(filename) {
    const [appName] = this.lookup(filename)

    if (appName === undefined) {
      dialog.alert("No app available to open this type of file")
      return
    }

    const app = this.value.dialogs[appName]

    dialog ??= await import("../ui/components/dialog.js").then((m) => m.default)

    const dir = new URL(dirname(app.path + "/"), location).href

    dialog({
      label: appName,
      content: {
        style: { width: "400px", height: "350px" },
        type: "ui-enclose",
        permissions: "app",
        // src: "/42/os/apps/TextEdit/index.html",
        srcdoc: `\
<!DOCTYPE html>
<meta charset="utf-8" />
<link rel="stylesheet" href="/style.css" id="theme" />
<script type="module">
  import App from "/42/os/class/App.js"
  import definition from "${app.path}"
  definition.dir = "${dir}"
  const app = await new App(definition).mount()
</script>
`,
      },
    })
  }
}

const apps = new AppManager("apps.cbor", DEFAULTS)
await apps.init()

export default apps
