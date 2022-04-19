export default {
  name: "TextEdit",

  categories: ["utilities", "productivity", "development"],

  decode: {
    types: [
      {
        description: "Text",
        accept: {
          "text/*": [],
          "application/json": [],
          "application/rss+xml": [],
          "application/xml": [],
        },
      },
    ],
    // excludeAcceptAllOption: true,
    // multiple: false,
  },

  // menubar,

  content: {
    // scope: "openedFiles",
    // repeat: {
    //   type: "div",
    //   content: "{{monospace}} --- {{blob|fileText}}",
    // },

    scope: "openedFiles.0",
    type: "textarea.w-full",
    name: "text",
    value: "{{file|text}}",
    class: "{{monospace ? 'font-mono' : ''}}",
    spellcheck: "{{spellcheck}}",
    wrap: "{{wrap ? 'soft' : 'off'}}",
    prose: false,
    compact: true,
    autofocus: true,
  },

  data: {
    monospace: false,
    spellcheck: true,
    wrap: true,
  },
}
