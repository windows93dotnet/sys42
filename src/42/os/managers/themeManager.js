import ConfigFile from "../class/ConfigFile.js"
import findIconPath from "../theme/findIconPath.js"

// import loadCSS from "../core/load/loadCSS.js"

const DEFAULTS = {
  style: new URL("../themes/windows9x/index.css", import.meta.url).pathname,
  icons: [new URL("../themes/default/icons", import.meta.url).pathname],
}

class ThemeManager extends ConfigFile {
  async init() {
    await super.init()
    // const el = await loadCSS(this.value.style)
    // document.querySelector("link#theme")?.remove()
    // el.id = "theme"
  }

  getIconImage(desc) {
    for (const theme of this.value.icons) {
      const path = findIconPath(theme, desc)
      if (path) return path
    }
  }
}

const themeManager = new ThemeManager("theme.json", DEFAULTS)
await themeManager.init()

export default themeManager