import system from "../system.js"
import findIconPath from "./theme/findIconPath.js"
import { ConfigFile } from "./class/ConfigFile.js"

import loadCSS from "../system/load/loadCSS.js"

const DEFAULTS = {
  // style: "/42/themes/default/index.css",
  style: "/42/themes/windows-9x/index.css",
  icons: ["/42/themes/default/icons"],
}

class Theme extends ConfigFile {
  async init() {
    await super.init()
    const el = await loadCSS(this.value.style)
    document.querySelector("link#theme")?.remove()
    el.id = "theme"
  }

  getIconImage(desc) {
    for (const theme of this.value.icons) {
      const path = findIconPath(theme, desc)
      if (path) return path
    }
  }
}

const theme = new Theme(`${system.HOME}/theme.cbor`, DEFAULTS)
await theme.init()

export default theme
