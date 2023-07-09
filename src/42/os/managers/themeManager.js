import ConfigFile from "../classes/ConfigFile.js"
import findIconPath from "./themeManager/findIconPath.js"

// import loadCSS from "../core/load/loadCSS.js"

const DEFAULTS = {
  style: new URL("../../themes/windows9x/index.css", import.meta.url).pathname,
  module: new URL("../../themes/windows9x/index.js", import.meta.url).pathname,
  icons: [new URL("../../themes/default/icons", import.meta.url).pathname],
}

class ThemeManager extends ConfigFile {
  #fallbackIcon

  async init() {
    if (this.value.module) {
      await import(this.value.module).then((module) => {
        this.module = module
        return module.install()
      })
    }
    // const el = await loadCSS(this.value.style)
    // document.querySelector("link#theme")?.remove()
    // el.id = "theme"
  }

  postload() {
    this.#fallbackIcon = undefined
  }

  async getIconPath(infos, size = "32x32") {
    await this.ready
    for (const themePath of this.value.icons) {
      const path = await findIconPath(themePath, infos, size)
      if (path) return path
    }

    if (typeof infos === "string") {
      // If unfound try from a freedesktop name
      // https://specifications.freedesktop.org/icon-naming-spec/latest/ar01s04.html
      infos = infos.replace("-", "/")
      for (const themePath of this.value.icons) {
        const path = await findIconPath(themePath, infos, size)
        if (path) return path
      }
    }

    this.#fallbackIcon ??= await findIconPath(
      this.value.icons[0],
      "subtype/octet-stream",
      size,
    )

    return this.#fallbackIcon
  }

  async refresh() {
    await this.ready
    this.module?.refresh()
  }
}

export const themeManager = new ThemeManager(".theme.json", DEFAULTS)
themeManager.init()

export default themeManager
