export default {
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
}
