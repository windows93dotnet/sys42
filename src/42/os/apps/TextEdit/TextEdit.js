function makeTabsizeDialog() {
  return {
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
  }
}

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
        makeTabsizeDialog(),
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
            makeTabsizeDialog(),
          ],
        },
      ],
    },
    makeTabsizeDialog(),
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
        bind: { to: "data" },
        value: "{{data ? cast.text(data) : field.stream(path)}}",
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
