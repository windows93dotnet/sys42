export default {
  menubar: [
    // {
    //   label: "New",
    //   picto: "file",
    //   id: "menuItem-newFile",
    //   shortcut: "Ctrl+N",
    //   click: "{{editor.newFile(}}",
    //   // click: "{{$files/0/path = undefined}}",
    // },
    // {
    //   label: "Open",
    //   picto: "folder-open",
    //   shortcut: "Ctrl+O",
    //   id: "menuItem-openFile",
    //   click: "{{editor.openFile(}}",
    //   // click: '{{\
    //   //   tmp = filePicker.open($files/0/path, {files: false});\
    //   //   $files/0/path = tmp ? locate(tmp, "selection.0") : $files/0/path;\
    //   // }}',
    // },
    // {
    //   label: "Save",
    //   picto: "save",
    //   shortcut: "Ctrl+S",
    //   id: "menuItem-saveFile",
    //   click: "{{editor.saveFile()}}",
    //   // click: "{{filePicker.save($files/0/path, $files/0/data)}}",
    // },
    {
      label: "View",
      content: [
        { label: "Monospace" }, //
      ],
    },
  ],

  content: {
    scope: "$files/0",
    content: [
      { tag: "text", bind: "/$dialog.title", compact: true },
      {
        tag: "textarea",
        label: "{{path}}",
        class: "{{/monospace ? 'font-mono' : ''}}",
        spellcheck: "{{/spellcheck}}",
        wrap: "{{/wrap ? 'soft' : 'off'}}",
        prose: false,
        compact: true,
        autofocus: true,
        lazy: true,
        bind: { to: "data" },
        value: "{{data ? cast.text(data) : fs.source(path)}}",
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

  state: {
    monospace: true,
    spellcheck: false,
    wrap: true,
  },
}
