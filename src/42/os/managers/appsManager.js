import ConfigFile from "../classes/ConfigFile.js"
import arrify from "../../fabric/type/any/arrify.js"
import pick from "../../fabric/type/object/pick.js"
import disk from "../../core/disk.js"
import mimetypesManager from "./mimetypesManager.js"
import normalizeManifest from "../classes/App/normalizeManifest.js"
import App from "../classes/App.js"

const REGISTRY_KEYS = [
  "name",
  "slug",
  "manifestPath",
  "categories",
  "icons",
  "width",
  "height",
  "geometry",
  "document",
  "inset",
]

class AppsManager extends ConfigFile {
  async populate() {
    this.value = {}

    await Promise.all(
      disk
        .glob("**/*app.json5")
        .map((manifestPath) => this.add(manifestPath, { save: false })),
    )

    return this.value
  }

  async add(manifestPath, options) {
    const fs = await import("../../core/fs.js") //
      .then((m) => m.default)

    const manifest = await fs.read.json5(manifestPath)

    if (manifest?.decode?.types) {
      await mimetypesManager.ready
      const undones = []
      for (const { accept, icons } of manifest.decode.types) {
        if (icons) {
          const manifestURL = new URL(manifestPath, location).href
          for (const icon of icons) {
            const src = new URL(icon.src, manifestURL).pathname

            const sizes = icon.sizes.split(" ")[0]

            const { pathname } = new URL(
              "../../themes/default/icons",
              import.meta.url,
            )

            const dest = `${pathname}/${sizes}${src.slice(
              src.indexOf(sizes) + sizes.length,
            )}`

            fs.link(src, dest)
          }
        }

        undones.push(mimetypesManager.add(accept, manifest.name))
      }

      await Promise.all(undones)
    }

    manifest.manifestPath = manifestPath
    await normalizeManifest(manifest, { skipNormaliseDecode: true })

    const out = pick(manifest, REGISTRY_KEYS)

    this.value[manifest.name] = out

    if (options?.save !== false) return this.save()
  }

  async launch(appName, state) {
    await this.ready
    if (appName in this.value === false) {
      throw new Error(`Unknown app: ${appName}`)
    }

    const app = this.value[appName]
    const options = state ? { state } : undefined
    return App.launch(app.manifestPath, options)
  }

  async open(paths) {
    await this.ready
    await mimetypesManager.ready

    const openers = {}

    for (const path of arrify(paths)) {
      if (path.endsWith("/")) {
        import("../../ui/components/explorer.js").then(({ explorer }) =>
          explorer(path),
        )
        continue
      }

      const { apps: appNames } = mimetypesManager.lookup(path)

      if (appNames.length > 0) {
        openers[appNames[0]] ??= []
        openers[appNames[0]].push(path)
      } else {
        import("../../ui/invocables/alert.js").then(({ alert }) =>
          alert("No app available to open this type of file"),
        )
      }
    }

    for (const [appName, paths] of Object.entries(openers)) {
      this.launch(appName, { $files: paths })
    }
  }

  async lookup(path) {
    await this.ready
    await mimetypesManager.ready
    const { apps: appNames } = mimetypesManager.lookup(path)

    const apps = []

    for (const appName of appNames) {
      const app = this.value[appName]
      if (app) apps.push(app)
    }

    return apps
  }

  async makeMenu(apps) {
    await this.ready

    if (typeof apps === "string") {
      apps = apps in this.value ? [this.value[apps]] : await this.lookup(apps)
    }

    if (!apps) {
      const values = Object.values(this.value)
      values.shift()
      apps = values.sort((a, b) => a.name.localeCompare(b.name))
    }

    const menu = []

    for (const { name, icons } of apps) {
      const menuItem = {
        label: name,
        click: () => this.launch(name),
      }

      for (const { sizes, src } of icons) {
        if (sizes === "16x16") {
          menuItem.picto = src
          break
        }

        menuItem.picto = src
      }

      menu.push(menuItem)
    }

    return menu
  }
}

const appsManager = new AppsManager(".apps.json")
appsManager.init()

export default appsManager
