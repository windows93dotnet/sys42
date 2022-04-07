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
    path: "/index.html",
    text: "hello",
    monospace: true,
    spellcheck: true,
    wrap: false,
  },
})

await app.mount()

app.run.open()
