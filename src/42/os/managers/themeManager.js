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
    await super.init()
    if (this.value.module) {
      await import(this.value.module).then((module) => {
        this.module = module
        module.install()
      })
    }
    // const el = await loadCSS(this.value.style)
    // document.querySelector("link#theme")?.remove()
    // el.id = "theme"
  }

  getIconPath(infos) {
    for (const themePath of this.value.icons) {
      const path = findIconPath(themePath, infos)
      if (path) return path
    }
  }

  async update() {
    await this.ready
    this.module?.update()
  }
}

const themeManager = new ThemeManager("theme.json", DEFAULTS)
themeManager.init()

export default themeManager
