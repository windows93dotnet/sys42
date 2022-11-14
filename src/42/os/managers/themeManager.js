import ConfigFile from "../classes/ConfigFile.js"
import findIconPath from "./themeManager/findIconPath.js"

// import loadCSS from "../core/load/loadCSS.js"

const DEFAULTS = {
  style: new URL("../../themes/windows9x/index.css", import.meta.url).pathname,
  module: new URL("../../themes/windows9x/index.js", import.meta.url).pathname,
  icons: [new URL("../../themes/default/icons", import.meta.url).pathname],
}

class ThemeManager extends ConfigFile {
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

  async getIconPath(infos, size) {
    await this.ready
    for (const themePath of this.value.icons) {
      const path = findIconPath(themePath, infos, size)
      if (path) return path
    }
  }

  async refresh() {
    await this.ready
    this.module?.refresh()
  }
}

export const themeManager = new ThemeManager("theme.json", DEFAULTS)
themeManager.init()

export default themeManager
