export default {
  menubar: [
    { $ref: "FileMenu" },
    {
      label: "View",
      items: [
        { $ref: "fullscreen" },
        { $ref: "openInNewTab" },
        "---",
        { tag: "checkbox", bind: "monospace" },
        { tag: "checkbox", bind: "wrap" },
        { tag: "checkbox", bind: "spellcheck" },
        {
          label: "Tab Size",
          items: [
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
    current: "{{$current}}",
    items: "{{$files}}",
    tabTemplate: {
      content: "{{dirty ? '*' : ''}}{{name}}",
    },
    panelTemplate: {
      content: [
        {
          tag: "textarea.size-full",
          // entry: "textbox",
          bind: "text",
          label: "{{path}}",
          class: "{{/monospace ? 'font-mono' : ''}}",
          style: { tabSize: "{{/tabSize}}" },
          spellcheck: "{{/spellcheck}}",
          wrap: "{{/wrap ? 'soft' : 'off'}}",
          lazy: true,
          prose: false,
          compact: true,
          autofocus: true,
        },
      ],
    },
    closable: true,
    transferable: {
      kind: ["$file", "$app"],
      accept: "$file",
      import({ paths, index, isOriginDropzone }) {
        if (isOriginDropzone) return

        index ??= $files.length
        $files.splice(index, 0, ...paths)
        $app.state.$current = index

        return "vanish"
      },
    },
  },
}
