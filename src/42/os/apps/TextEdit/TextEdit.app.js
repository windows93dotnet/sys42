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
    type: "ui-tabs",
    scope: "openedFiles",
    label: "{{path|basename}}{{dirty ? '*' : ''}}",
    content: {
      type: "textarea.w-full",
      name: "text",
      label: "{{openedFiles|at(currentTab)|locate('path')}}",
      value: "{{openedFiles|at(currentTab)|locate('file')|text}}",
      class: "{{monospace ? 'font-mono' : ''}}",
      spellcheck: "{{spellcheck}}",
      wrap: "{{wrap ? 'soft' : 'off'}}",
      prose: false,
      compact: true,
      autofocus: true,
    },
  },

  data: {
    monospace: !false,
    spellcheck: !true,
    wrap: true,
  },
}
