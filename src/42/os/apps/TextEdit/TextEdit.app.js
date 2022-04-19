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
    // type: "textarea.w-full",
    // name: "text",
    // // value: "{{openedFiles.0.blob|fileText}}",
    // value: "{{at(openedFiles, current)|locate('blob')|fileText}}",
    // class: "{{monospace ? 'font-mono' : ''}}",
    // spellcheck: "{{spellcheck}}",
    // prose: false,
    // compact: true,

    scope: "openedFiles",
    repeat: {
      type: "div",
      content: "{{monospace}} --- {{blob|fileText}}",
    },
  },

  data: {
    monospace: true,
    spellcheck: true,
    wrap: false,
  },
}
