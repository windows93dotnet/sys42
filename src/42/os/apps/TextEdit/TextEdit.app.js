export default {
  name: "TextEdit",
  command: "textedit",

  categories: ["utilities", "productivity", "development"],
  description: "A simple text editor using textarea",

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
    scope: "$files/0",
    content: {
      scope: "text",
      tag: "textarea",
      label: "{{path}}",
      value: "{{text ? text : source(path)}}",
      class: "w-full {{/monospace ? 'font-mono' : ''}}",
      spellcheck: "{{/spellcheck}}",
      wrap: "{{/wrap ? 'soft' : 'off'}}",
      prose: false,
      compact: true,
      autofocus: true,
    },
  },

  state: {
    monospace: true,
    spellcheck: false,
    wrap: true,
  },
}
