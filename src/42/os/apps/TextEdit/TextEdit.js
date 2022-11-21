export default {
  menubar: [
    { $ref: "FileMenu" },
    {
      label: "View",
      content: [
        { $ref: "fullscreen" },
        { $ref: "openInNewTab" },
        "---",
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
    { $ref: "HelpMenu" },
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
      {
        tag: "textarea",
        entry: "textbox",
        label: "{{path}}",
        class: "{{/monospace ? 'font-mono' : ''}}",
        style: { tabSize: "{{/tabSize}}" },
        spellcheck: "{{/spellcheck}}",
        wrap: "{{/wrap ? 'soft' : 'off'}}",
        prose: false,
        compact: true,
        autofocus: true,
        lazy: true,
        bind: { to: "data" },
        on: {
          "input": "{{dirty = true}}",
          ":name || :dirty || focus": `{{
            /$dialog.title = 'TextEdit - ' + name;
            /$dialog.title += dirty ? '*' : '';
          }}`,

          ":stream": `{{
            // locked = true;
            // log(textbox);
            field.sink(stream, textbox);
            // locked = false;
          }}`,
        },
      },
    ],
  },
}
