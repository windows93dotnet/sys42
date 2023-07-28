/* eslint-disable max-depth */
/* eslint-disable complexity */
import ConfigFile from "../classes/ConfigFile.js"
import arrify from "../../fabric/type/any/arrify.js"
import pick from "../../fabric/type/object/pick.js"
import disk from "../../core/disk.js"
import isHashmapLike from "../../fabric/type/any/is/isHashmapLike.js"
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

  async makeMenu(val) {
    await this.ready

    let state
    let sort

    if (typeof val === "string") {
      val = val in this.value ? [this.value[val]] : await this.lookup(val)
    } else if (Array.isArray(val)) {
      await mimetypesManager.ready

      const counts = {}

      const appNames = new Set()
      for (const item of val) {
        if (item in this.value) appNames.add(item)
        else {
          state ??= {}
          state.$files ??= []
          state.$files.push(item)
          const { apps } = mimetypesManager.lookup(item)
          for (const app of apps) {
            appNames.add(app)
            counts[app] = (counts[app] ?? 0) + 1
          }
        }
      }

      val = []
      for (const appName of appNames) {
        if (appName in this.value) val.push(this.value[appName])
      }

      val.sort((a, b) => counts[b.name] - counts[a.name])
    } else if (isHashmapLike(val)) {
      if ("mimetype" in val) {
        sort = true
        const { mimetype } = val
        const appNames = new Set()
        for (const { apps } of mimetypesManager.list(mimetype, {
          withApps: true,
        })) {
          for (const appName of apps) {
            if (appName in this.value) appNames.add(appName)
          }
        }

        val = []
        for (const appName of appNames) {
          if (appName in this.value) val.push(this.value[appName])
        }
      }
    } else if (!val) {
      sort = true
      val = Object.values(this.value) //
    }

    if (sort) val.sort((a, b) => a.name.localeCompare(b.name))

    const menu = []

    for (const { name, icons } of val) {
      const menuItem = {
        label: name,
        click: () => this.launch(name, state),
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

export const appsManager = new AppsManager(".apps.json")
appsManager.init()

export default appsManager
