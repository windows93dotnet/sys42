import "../../theme.js"
import inIframe from "../../../system/env/runtime/inIframe.js"
import preinstall from "../../utils/preinstall.js"
import ui from "../../../ui.js"
import fs from "../../../system/fs.js"

const install = preinstall({
  name: "TextEdit",
  categories: ["utilities", "productivity", "development"],
  // tray, taskbar
})

const content = [
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
        run: "open",
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
      "---",
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

import explorer from "../../../ui/components/explorer.js"

const app = await ui({
  type: ".box-fit.box-h",
  content: [
    { type: "ui-menubar", content },
    {
      type: "footer",
      content: [
        {
          type: "button#explorer",
          label: "explorer",
          async run() {
            const res = await explorer("/42/")
            console.log("explorer res:", res)
          },
        },
        {
          content: " {{dirty ? '*' : '~'}}",
        },
      ],
    },
    {
      // type: "textarea.w-full.{{monospace}}",
      type: "textarea.w-full",
      name: "text",
      class: "{{monospace}}",
      spellcheck: "{{spellcheck}}",
      prose: false,
      compact: true,
    },
  ],

  data: {
    path: undefined,
    text: "hello",
    monospace: "font-mono",
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
      const res = await explorer.pick(this.path)
      if (res) {
        this.path = res.selection[0]
        this.text = await res.files[0].text()
        this.dirty = false
      }
    },

    async save() {
      await (this.path
        ? fs.write(this.path, new Blob([this.text]))
        : app.def.actions.saveAs.call(this))
      this.dirty = false
    },

    async saveAs() {
      const res = await explorer.save(this.path ?? "untitled.txt")
      if (res) {
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

app.state.on("update", (queue) => {
  if (queue.has("text")) app.data.dirty = true
})

// app.get("#open").click()
// app.get("#save").click()
