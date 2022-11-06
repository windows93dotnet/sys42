export default {
  menubar: [
    { $ref: "./#/$defs/FileMenu" }, // TODO: improve resolve with $ref starting with #
    {
      label: "View",
      content: [
        { tag: "checkbox", bind: "monospace" },
        { tag: "checkbox", bind: "wrap" },
        { tag: "checkbox", bind: "spellcheck" },
        {
          label: "Tab Size",
          content: [
            { tag: "radio", bind: "tabSize", value: "2" },
            { tag: "radio", bind: "tabSize", value: "4" },
            { tag: "radio", bind: "tabSize", value: "6" },
            { tag: "radio", bind: "tabSize", value: "8" },
            "---",
            {
              label: "Custom",
              dialog: {
                label: "Tab Size",
                content: {
                  tag: "number",
                  bind: "tabSize",
                  min: 0,
                  max: 16,
                  compact: true,
                },
              },
            },
          ],
        },
      ],
    },
  ],

  state: {
    monospace: true,
    spellcheck: false,
    wrap: true,
    tabSize: "2",
  },

  content: {
    scope: "$files/0",
    content: [
      // { tag: "text", bind: "/$dialog.title", compact: true },
      // { tag: "text", bind: "/tabSize", compact: true },
      {
        tag: "textarea",
        label: "{{path}}",
        class: "{{/monospace ? 'font-mono' : ''}}",
        style: { tabSize: "{{/tabSize}}" },
        spellcheck: "{{/spellcheck}}",
        wrap: "{{/wrap ? 'soft' : 'off'}}",
        prose: false,
        compact: true,
        autofocus: true,
        lazy: true,
        bind: { to: "data" /* , from: "text" */ },
        value: "{{field.sink(stream)}}",
        // value: "{{text}}",
        on: {
          "input": "{{dirty = true}}",
          ":path || :dirty || focus": `{{
            /$dialog.title = 'TextEdit - ' + path.getBasename(path ?? '');
            /$dialog.title += dirty ? '*' : '';
          }}`,
        },
      },
    ],
  },
}
