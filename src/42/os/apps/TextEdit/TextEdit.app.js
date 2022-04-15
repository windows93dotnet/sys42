import App from "../../class/App.js"

export const definition = {
  name: "TextEdit",

  categories: ["utilities", "productivity", "development"],

  decode: {
    types: [
      {
        description: "Images",
        accept: {
          "text/*": [],
        },
      },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
  },

  // menubar,

  content: {
    type: "textarea.w-full",
    name: "text",
    class: "{{monospace ? 'font-mono' : ''}}",
    spellcheck: "{{spellcheck}}",
    prose: false,
    compact: true,
  },

  data: {
    path: "/index.html",
    text: "hello",
    monospace: true,
    spellcheck: true,
    wrap: false,
  },
}

export default await new App(definition).mount()
