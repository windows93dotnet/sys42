import ConfigFile from "../classes/ConfigFile.js"
import arrify from "../../fabric/type/any/arrify.js"
import pick from "../../fabric/type/object/pick.js"
import disk from "../../core/disk.js"
import mimetypesManager from "./mimetypesManager.js"
import App from "../classes/App.js"

const REGISTRY_KEYS = [
  "name",
  "path",
  "manifest",
  "categories",
  "inset",
  "geometry",
  "width",
  "height",
]

class AppsManager extends ConfigFile {
  async populate() {
    this.value = {}

    await Promise.all(
      disk
        .glob("**/*.app.json5")
        .map((manifestPath) => this.add(manifestPath, { save: false }))
    )

    return this.value
  }

  async add(manifestPath, options) {
    const fs = await import("../../core/fs.js") //
      .then((m) => m.default)

    const manifest = await fs.read.json5(manifestPath)

    if (manifest?.decode?.types) {
      const undones = []
      for (const { accept } of manifest.decode.types) {
        undones.push(mimetypesManager.add(accept, manifest.name))
      }

      await Promise.all(undones)
    }

    const out = pick(manifest, REGISTRY_KEYS)
    out.manifest = manifestPath

    this.value[manifest.name] = out

    if (options?.save !== false) return this.save()
  }

  async open(paths) {
    await this.ready

    const openers = {}

    for (const path of arrify(paths)) {
      const apps = mimetypesManager.getApps(path)

      if (apps?.length) {
        openers[apps[0]] ??= []
        openers[apps[0]].push(path)
      } else {
        import("../../ui/invocables/alert.js").then(({ default: alert }) =>
          alert("No app available to open this type of file")
        )
      }
    }

    const entries = Object.entries(openers)

    for (const [appName, paths] of entries) {
      this.exec(appName, { paths })
    }
  }

  async exec(appName, state) {
    await this.ready
    const app = this.value[appName]
    App.launch(app.manifest, { state })
  }
}

const appsManager = new AppsManager("apps.json")
appsManager.init()

export default appsManager
