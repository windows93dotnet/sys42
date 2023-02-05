export default {
  menubar: [
    { $ref: "FileMenu" }, //
    { $ref: "ViewMenu" },
    { $ref: "HelpMenu" },
  ],

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
          tag: "div.size-full.inset.checkboard",
          content: "{{path}}",
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
