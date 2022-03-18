import "../../theme.js"
import inIframe from "../../../system/env/runtime/inIframe.js"
import preinstall from "../../utils/preinstall.js"
import ui from "../../../ui.js"

const install = preinstall({
  name: "TextEdit",
  categories: ["utilities", "productivity", "development"],
  // tray, taskbar
})

const content = [
  // { label: "Clear" /* , run: "clear" */ },
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
        // run: "open",
        dialog: {
          content: "hello",
        },
      },
      {
        label: "Save",
        picto: "save",
        shortcut: "Ctrl+S",
        run: "save",
      },
      "---",
      {
        label: "Recent",
        content: [{ label: "Clear", run: "clear" }],
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
  {
    label: "Fullscreen",
    run: "fullscreen",
    disabled: !document.fullscreenEnabled,
  },
]

const app = await ui({
  type: ".box-fit.box-h",
  content: [
    { type: "ui-menubar", content },
    { type: "textarea.w-full", name: "text", compact: true },
  ],

  data: {
    path: undefined,
    text: "hello",
  },

  actions: {
    new() {
      this.path = undefined
      this.text = ""
    },
    async open() {
      // eslint-disable-next-line no-alert
      const path = prompt("Path", "/")
      if (path == null) return
      this.path = path
      const fs = import("../../../system/fs.js").then((m) => m.default)
      this.text = await fs.readText(this.path)
    },
    async save() {
      const fs = import("../../../system/fs.js").then((m) => m.default)
      if (this.path) await fs.writeText(this.path, this.text)
      else app.def.actions.saveAs.call(this)
    },
    async saveAs() {
      // eslint-disable-next-line no-alert
      const path = prompt("Path", "/")
      if (path == null) return
      this.path = path
      return app.def.actions.save.call(this)
    },
    install() {
      if (inIframe) {
        window.open(location, "_blank")
      } else {
        install()
      }
    },
    async fullscreen() {
      try {
        await document.documentElement.requestFullscreen({
          navigationUI: "hide",
        })
      } catch (err) {
        console.log(err)
      }
    },
  },
})

// dialog("yo")

// if (!(await fs.access("/test.txt"))) {
//   fs.writeText("/test.txt", "hello")
// }

// setTimeout(() => {
//   ui.get("ui-menubar #file").dispatchEvent(new PointerEvent("pointerdown"))
// }, 100)
