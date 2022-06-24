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

  content: [
    {
      type: "ui-tabs",
      items: { watch: "openedFiles" },
      each: {
        label: "{{path ?? 'Untitled'|basename}}{{dirty ? '*' : ''}}",
        content: {
          type: "textarea.w-full",
          name: "text",
          label: "{{path}}",
          value: "{{text ? text : read(path)}}",
          class: "{{monospace ? 'font-mono' : ''}}",
          spellcheck: "{{spellcheck}}",
          wrap: "{{wrap ? 'soft' : 'off'}}",
          prose: false,
          compact: true,
          autofocus: true,
        },
      },
    },
  ],

  data: {
    monospace: !false,
    spellcheck: !true,
    wrap: true,
  },
}
