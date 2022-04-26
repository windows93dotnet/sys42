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
      type: "header",
      content: [
        {
          type: "checkbox",
          name: "monospace",
        },
        {
          type: "button",
          label: "lol",
          run() {
            console.log(this["@target"])
          },
        },
      ],
    },

    // {
    //   type: "textarea.w-full",
    //   name: "text",
    //   label: "{{path}}",
    //   value: "{{text ? text : read(openedFiles.0.path)}}",
    //   class: "{{monospace ? 'font-mono' : ''}}",
    //   spellcheck: "{{spellcheck}}",
    //   wrap: "{{wrap ? 'soft' : 'off'}}",
    //   prose: false,
    //   compact: true,
    //   autofocus: true,
    // },

    /* ***************** */
    // {
    //   scope: "openedFiles.0",
    //   content: {
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
    //   scope: "openedFiles.1",
    //   content: {
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
    /* ***************** */

    {
      scope: "openedFiles",
      repeat: {
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

    // {
    //   type: "checkbox",
    //   name: "monospace",
    // },
    // {
    //   type: "ui-tabs",
    //   // scope: "openedFiles",
    //   items: { watch: "openedFiles" },
    //   repeat: {
    //     label: "{{path|basename}}{{dirty ? '*' : ''}}",
    //     content: {
    //       type: "textarea.w-full",
    //       name: "text",
    //       label: "{{path}}",
    //       // value: "{{file|text}}",
    //       // value: "{{text ? text : path|read}}",
    //       class: "{{monospace ? 'font-mono' : ''}}",
    //       spellcheck: "{{spellcheck}}",
    //       wrap: "{{wrap ? 'soft' : 'off'}}",
    //       prose: false,
    //       compact: true,
    //       autofocus: true,
    //     },
    //   },
    // },
  ],

  data: {
    monospace: !false,
    spellcheck: !true,
    wrap: true,
  },
}
