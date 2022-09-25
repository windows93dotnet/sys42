/* eslint-disable unicorn/no-this-assignment */
import inIframe from "../../core/env/realm/inIframe.js"
import preinstall from "../utils/preinstall.js"
import UI from "../../ui/class/UI.js"
import getBasename from "../../fabric/type/path/core/getBasename.js"
import getDirname from "../../fabric/type/path/core/getDirname.js"

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
        label: "Install Web App",
        click: "{{install()}}",
      },
    ],
  },
]

export default class App extends UI {
  constructor(manifest) {
    let { name, categories, state, content, encode, decode, dir } = manifest
    dir ??= getDirname(document.URL) + "/"

    const install = preinstall({ name, categories, dir })

    state.$files ??= [{ dirty: false, path: undefined }]

    super({
      tag: ".box-fit.box-h",
      content: [{ tag: "ui-menubar", content: menubar }, content],

      state,

      actions: {
        new() {
          // console.log(this.run)
          // console.log($files)
          $files[0].text = "hello empty"
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

    this.manifest = manifest
    const app = this
    const $files = this.reactive.get("$files")
  }
}
