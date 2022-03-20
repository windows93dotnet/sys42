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
      this.text = ""
    },

    async open() {
      const res = await explorer.pick(this.path)
      if (res) {
        this.path = res.selection[0]
        this.text = await res.files[0].text()
      }
    },

    async save() {
      const res = await (this.path
        ? explorer.save(this.path, new Blob([this.text]))
        : app.def.actions.saveAs.call(this))
      console.log("save", res)
    },

    async saveAs() {
      const res = await explorer.save("unamed.txt", new Blob([this.text]))
      console.log("saveAs", res)
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

app.get("#explorer").click()
