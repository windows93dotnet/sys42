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
    tag: "ui-tabs",
    closable: true,
    transferable: {
      kind: ["$file", "$app"],
      accept: "$file",
      import({ paths, dropzone, index }) {
        if (dropzone.el.parentElement) {
          const cpn = dropzone.el.parentElement
          index ??= cpn.stage.state.$files.length
          cpn.stage.state.$files.splice(index, 0, ...paths)
          cpn.stage.state.$current = index
        }

        return "vanish"
      },
    },
    current: "{{$current}}",
    items: "{{$files}}",
    tabTemplate: {
      content: "{{dirty ? '*' : ''}}{{name}}",
    },
    panelTemplate: {
      content: [
        {
          tag: "textarea.size-full",
          entry: "textbox",
          label: "{{path}}",
          class: "{{/monospace ? 'font-mono' : ''}}",
          style: { tabSize: "{{/tabSize}}" },
          spellcheck: "{{/spellcheck}}",
          wrap: "{{/wrap ? 'soft' : 'off'}}",
          prose: false,
          compact: true,
          autofocus: true,
          bind: "text",
        },
      ],
    },
  },
}
