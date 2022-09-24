export default {
  name: "TextEdit",
  command: "textedit",

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
    scope: "$files/0",
    content: {
      scope: "text",
      tag: "textarea",
      label: "{{path}}",
      // value: "{{text ? text : read(path)}}",
      value: "{{text ? text : source(path)}}",
      class: "w-full {{/monospace ? 'font-mono' : ''}}",
      spellcheck: "{{/spellcheck}}",
      wrap: "{{/wrap ? 'soft' : 'off'}}",
      prose: false,
      compact: true,
      autofocus: true,
    },
  },

  // content: [
  //   {
  //     tag: "ui-tabs",
  //     items: "{{$files}}",
  //     each: {
  //       label: "{{path ?? 'Untitled' |> basename}}{{dirty ? '*' : ''}}",
  //       content: {
  //         tag: "textarea.w-full",
  //         name: "text",
  //         label: "{{path}}",
  //         value: "{{text ? text : read(path)}}",
  //         class: "{{monospace ? 'font-mono' : ''}}",
  //         spellcheck: "{{spellcheck}}",
  //         wrap: "{{wrap ? 'soft' : 'off'}}",
  //         prose: false,
  //         compact: true,
  //         autofocus: true,
  //       },
  //     },
  //   },
  // ],

  state: {
    monospace: true,
    spellcheck: false,
    wrap: true,
  },
}
