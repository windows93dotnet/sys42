/* eslint-disable unicorn/no-this-assignment */
import inIframe from "../../core/env/realm/inIframe.js"
import preinstall from "../utils/preinstall.js"
import UI from "../../ui/class/UI.js"
import getBasename from "../../core/path/core/getBasename.js"
import getDirname from "../../core/path/core/getDirname.js"
import openInNewTab from "../../fabric/browser/openInNewTab.js"
import io from "../io.js"

let toggleFullscreen
let fileImport
let fileExport

const menubar = [
  {
    label: "File",
    id: "file",
    content: [
      {
        label: "New",
        picto: "file",
        shortcut: "Ctrl+N",
        click: "{{new()}}",
      },
      {
        label: "Open…",
        picto: "folder-open",
        shortcut: "Ctrl+O",
        id: "open",
        click: "{{open()}}",
      },
      {
        label: "Save",
        picto: "save",
        shortcut: "Ctrl+S",
        id: "save",
        click: "{{save()}}",
      },
      {
        label: "Save As…",
        picto: "save",
        shortcut: "Ctrl+Shift+S",
        id: "saveAs",
        click: "{{saveAs()}}",
      },
      "---",
      {
        label: "Import…",
        picto: "import",
        id: "import",
        click: "{{import()}}",
      },
      {
        label: "Export…",
        picto: "export",
        id: "export",
        click: "{{export()}}",
      },
    ],
  },
  {
    label: "View",
    content: [
      {
        label: "Fullscreen",
        click: "{{fullscreen()}}",
        disabled: !document.fullscreenEnabled,
      },
      {
        label: "Open in new tab",
        click: "{{openInNewTab()}}",
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
      {
        label: "Word-wrap",
        name: "wrap",
        type: "checkbox",
      },
    ],
  },
  {
    label: "About",
    content: [
      {
        label: "Install as Web App",
        click: "{{install()}}",
      },
    ],
  },
]

export default class App extends UI {
  constructor(manifest) {
    if (manifest.dir === undefined) {
      const url = document.URL
      manifest.dir = url.endsWith("/") ? url : getDirname(url) + "/"
    }

    const install = preinstall(manifest)

    const { state, content, encode, decode, dir } = manifest

    // openInNewTab(dir)

    state.$files ??= [{ dirty: false, path: undefined }]

    io.on("files", async (files) => {
      setTimeout(async () => {
        $files[0].text = await files[0].text()
      }, 400)
    })

    super({
      tag: ".box-fit.box-h",
      content: [{ tag: "ui-menubar", content: menubar }, content],

      state,

      actions: {
        new() {
          // console.log(this.run)
          // console.log($files)
          $files[0].text = ""
          // this.currentTab = this.files.length
          // this.files.push({ dirty: false, path: undefined })
        },

        async open() {
          const explorer = await import("../../ui/components/explorer.js") //
            .then((m) => m.default)
          const res = await explorer.pick(this.path)
          if (res) {
            this.currentTab = this.files.length
            this.files.push({ dirty: false, path: res.selection[0] })
          }
        },

        async save() {
          if (this.path) {
            const fs = await import("../../core/fs.js").then((m) => m.default)
            fs.write(this.path, new Blob([this.text]))
            this.dirty = false
          } else {
            // await this.$run.saveAs()
            await app.run.saveAs()
          }
        },

        async saveAs() {
          const explorer = await import("../../ui/components/explorer.js") //
            .then((m) => m.default)
          const res = await explorer.save(this.path ?? "untitled.txt")
          if (res) {
            const fs = await import("../../core/fs.js").then((m) => m.default)
            await fs.write(res, new Blob([this.text]))
            this.path = res
            this.dirty = false
          }
        },

        async import() {
          fileImport ??= await import(
            "../../fabric/type/file/fileImport.js"
          ).then((m) => m.default)
          const [file] = await fileImport(decode)
          if (file) {
            this.text = await file.text()
            this.dirty = false
          }
        },

        async export() {
          fileExport ??= await import(
            "../../fabric/type/file/fileExport.js"
          ).then((m) => m.default)
          await fileExport(
            new File([this.text], getBasename(this.path)),
            encode
          )
        },

        openInNewTab() {
          // window.open(dir, "_blank", "noopener=true")
          openInNewTab(dir)
        },

        install() {
          if (inIframe) {
            openInNewTab(dir + "?install")
            // window.open(dir + "?install", "_blank", "noopener=true")
          } else {
            install()
          }
        },

        async fullscreen() {
          toggleFullscreen ??= await import(
            "../../fabric/browser/toggleFullscreen.js"
          ).then((m) => m.default)
          toggleFullscreen()
        },
      },
    })

    this.manifest = manifest
    const app = this
    const $files = this.reactive.get("$files")
  }
}
