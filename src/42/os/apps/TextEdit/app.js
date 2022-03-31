import "../../theme.js"
import inIframe from "../../../system/env/runtime/inIframe.js"
import preinstall from "../../utils/preinstall.js"
import ui from "../../../ui.js"

let fs
let explorer
let toggleFullscreen

const install = preinstall({
  name: "TextEdit",
  categories: ["utilities", "productivity", "development"],
  // tray, taskbar
})

const content = [
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
  // {
  //   label: "Fullscreen",
  //   // type: "checkbox",
  //   run: "fullscreen",
  //   disabled: !document.fullscreenEnabled,
  // },
]

const app = await ui({
  type: ".box-fit.box-h",
  content: [
    { type: "ui-menubar", content },
    {
      type: "textarea.w-full",
      name: "text",
      class: "{{monospace ? 'font-mono' : ''}}",
      spellcheck: "{{spellcheck}}",
      prose: false,
      compact: true,
    },
  ],

  data: {
    path: undefined,
    text: "hello",
    monospace: true,
    spellcheck: true,
    wrap: false,
  },

  actions: {
    new() {
      this.path = undefined
      this.dirty = false
      this.text = ""
    },

    async open() {
      explorer ??= await import("../../../ui/components/explorer.js") //
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
        fs ??= await import("../../../system/fs.js").then((m) => m.default)
        fs.write(this.path, new Blob([this.text]))
        this.dirty = false
      } else {
        await this.$run.saveAs()
      }
    },

    async saveAs() {
      explorer ??= await import("../../../ui/components/explorer.js") //
        .then((m) => m.default)
      const res = await explorer.save(this.path ?? "untitled.txt")
      if (res) {
        fs ??= await import("../../../system/fs.js").then((m) => m.default)
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
        "../../../fabric/dom/toggleFullscreen.js"
      ).then((m) => m.default)
      toggleFullscreen()
    },
  },
})

app.state.on("update", (queue) => {
  if (queue.has("text")) app.data.dirty = true
})

app.run.save()
