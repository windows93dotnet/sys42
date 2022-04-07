/* eslint-disable unicorn/no-this-assignment */
import inIframe from "../../system/env/runtime/inIframe.js"
import preinstall from "../utils/preinstall.js"
import UI from "../../ui/class/UI.js"

let fs
let explorer
let toggleFullscreen

const menubar = [
  {
    label: "File",
    id: "file",
    content: [
      {
        label: "New",
        picto: "file",
        shortcut: "Ctrl+N",
        run: "new",
      },
      {
        label: "Open",
        picto: "folder-open",
        shortcut: "Ctrl+O",
        id: "open",
        run: "open",
      },
      {
        label: "Save",
        picto: "save",
        shortcut: "Ctrl+S",
        id: "save",
        run: "save",
      },
      {
        label: "Save As…",
        picto: "save",
        shortcut: "Ctrl+Shift+S",
        id: "saveAs",
        run: "saveAs",
      },
    ],
  },
  {
    label: "View",
    content: [
      {
        label: "Fullscreen",
        run: "fullscreen",
        disabled: !document.fullscreenEnabled,
      },
      "---",
      {
        label: "Monospace",
        type: "checkbox",
      },
      {
        label: "Spellcheck",
        type: "checkbox",
      },
    ],
  },
  {
    label: "About",
    content: [
      {
        label: "Install Web App",
        run: "install",
      },
    ],
  },
]

export default class App extends UI {
  constructor({ name, categories, data, content }) {
    const install = preinstall({ name, categories })

    super({
      type: ".box-fit.box-h",
      content: [{ type: "ui-menubar", content: menubar }, content],

      data,

      actions: {
        new() {
          this.path = undefined
          this.dirty = false
          this.text = ""
        },

        async open() {
          explorer ??= await import("../../ui/components/explorer.js") //
            .then((m) => m.default)
          const res = await explorer.pick(this.path)
          if (res) {
            this.path = res.selection[0]
            this.text = await res.files[0].text()
            this.dirty = false
          }
        },

        async save() {
          if (this.path) {
            fs ??= await import("../../system/fs.js").then((m) => m.default)
            fs.write(this.path, new Blob([this.text]))
            this.dirty = false
          } else {
            // await this.$run.saveAs()
            await app.run.saveAs()
          }
        },

        async saveAs() {
          explorer ??= await import("../../ui/components/explorer.js") //
            .then((m) => m.default)
          const res = await explorer.save(this.path ?? "untitled.txt")
          if (res) {
            fs ??= await import("../../system/fs.js").then((m) => m.default)
            await fs.write(res, new Blob([this.text]))
            this.path = res
            this.dirty = false
          }
        },

        install() {
          if (inIframe) {
            window.open(location, "_blank")
          } else {
            install()
          }
        },

        async fullscreen() {
          toggleFullscreen ??= await import(
            "../../fabric/dom/toggleFullscreen.js"
          ).then((m) => m.default)
          toggleFullscreen()
        },
      },
    })

    const app = this
  }
}
