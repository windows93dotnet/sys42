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
    // {
    //   type: "header",
    //   content: [
    //     {
    //       type: "checkbox",
    //       name: "monospace",
    //     },
    //     {
    //       type: "button",
    //       label: "lol",
    //       run() {
    //         console.log(this["@target"])
    //       },
    //     },
    //   ],
    // },

    // {
    //   scope: "openedFiles",
    //   repeat: {
    //     type: "textarea.w-full",
    //     name: "text",
    //     label: "{{path}}",
    //     value: "{{text ? text : read(path)}}",
    //     class: "{{monospace ? 'font-mono' : ''}}",
    //     spellcheck: "{{spellcheck}}",
    //     wrap: "{{wrap ? 'soft' : 'off'}}",
    //     prose: false,
    //     compact: true,
    //     autofocus: true,
    //   },
    // },

    // {
    //   type: "ui-tabs",
    //   // scope: "openedFiles",
    //   items: { watch: "openedFiles" },
    //   repeat: {
    //     label: "{{path|basename}}{{dirty ? '*' : ''}}",
    //     content: "{{path|read}}",
    //     // content: {
    //     //   type: "textarea.w-full",
    //     //   // name: "text",
    //     //   label: "{{path}}",
    //     //   // value: "{{file|text}}",
    //     //   // value: "{{text ? text : read(path)}}",
    //     //   // value: "{{path}}",
    //     //   value: "{{path|read}}",
    //     //   class: "{{monospace ? 'font-mono' : ''}}",
    //     //   spellcheck: "{{spellcheck}}",
    //     //   wrap: "{{wrap ? 'soft' : 'off'}}",
    //     //   prose: false,
    //     //   compact: true,
    //     //   autofocus: true,
    //     // },
    //   },
    // },

    {
      type: "ui-tabs",
      // scope: "openedFiles",
      items: { watch: "openedFiles" },
      repeat: {
        label: "{{path|basename}}{{dirty ? '*' : ''}}",
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
