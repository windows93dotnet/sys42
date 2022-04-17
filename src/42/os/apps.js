import { ConfigFile } from "./class/ConfigFile.js"
import parseFilename from "../fabric/type/path/parseFilename.js"
import disk from "../system/fs/disk.js"

const DEFAULTS = {
  defaultApps: {
    mimetypes: {},
    extensions: {},
  },
}

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
        import(path).then((m) => {
          const def = m.default
          if (def?.decode?.types) {
            addMIMETypes(this.value, def.name, def.decode.types)
          }

          const { categories } = def
          this.value.dialogs[def.name] = { path, categories }
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
}

const apps = new AppManager("apps.cbor", DEFAULTS)
await apps.init()

export default apps
