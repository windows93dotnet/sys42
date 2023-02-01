/* eslint-disable max-depth */
import ConfigFile from "../classes/ConfigFile.js"
import arrify from "../../fabric/type/any/arrify.js"
import pick from "../../fabric/type/object/pick.js"
import disk from "../../core/disk.js"
import mimetypesManager from "./mimetypesManager.js"
import normalizeManifest from "../classes/App/normalizeManifest.js"
import App from "../classes/App.js"

import getBasename from "../../core/path/core/getBasename.js"

const REGISTRY_KEYS = [
  "name",
  "slug",
  "path",
  "manifestPath",
  "categories",
  "inset",
  "geometry",
  "width",
  "height",
  "icons",
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
      await mimetypesManager.ready
      const undones = []
      for (const { accept, icons } of manifest.decode.types) {
        if (icons) {
          const manifestURL = new URL(manifestPath, location).href
          for (const icon of icons) {
            const src = new URL(icon.src, manifestURL).pathname
            let { pathname } = new URL(
              "../../themes/default/icons",
              import.meta.url
            )
            if (icon.sizes === "16x16") pathname += "/16"
            fs.link(src, `${pathname}/subtype/${getBasename(src)}`)
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

  async open(paths) {
    await this.ready
    await mimetypesManager.ready

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
      this.exec(appName, { $files: paths })
    }
  }

  async exec(appName, state) {
    await this.ready
    if (appName in this.value === false) {
      throw new Error(`Unknown app: ${appName}`)
    }

    const app = this.value[appName]
    return App.launch(app.manifestPath, { state })
  }

  async makeMenu(apps) {
    await this.ready

    apps = apps
      ? Object.entries(apps)
      : Object.entries(this.value).sort(([a], [b]) => a.localeCompare(b))

    const menu = []

    for (const [appName, { icons }] of apps) {
      if (appName === "version") continue

      const menuItem = {
        label: appName,
        click: () => {
          this.exec(appName)
        },
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
