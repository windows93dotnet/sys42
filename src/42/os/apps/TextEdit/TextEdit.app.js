import App from "../../class/App.js"

const app = new App({
  name: "TextEdit",

  categories: ["utilities", "productivity", "development"],

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
    path: undefined,
    text: "hello",
    monospace: true,
    spellcheck: true,
    wrap: false,
  },
})

app.mount()
