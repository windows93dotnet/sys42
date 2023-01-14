import ui from "../../../../42/ui.js"

import disk from "../../../../42/core/disk.js"
const list = disk.glob("/tests/fixtures/formats/*", {
  sort: "mimetype",
})

ui({
  tag: "body.box-fit.box-center.gap._box-v._ground",
  style: { padding: "90px" },

  content: [
    // {
    //   tag: "ui-grid.inset.paper",
    //   style: { width: "400px", height: "250px" },
    //   content: list.map((path) => ({ tag: "ui-icon", path })),
    // },

    {
      tag: "ui-grid.inset.paper.resize",
      style: { width: "300px", height: "300px" },
      selection: ["/tests/fixtures/formats/example.json"],
      selectionKey: "path",
      itemTemplate: {
        tag: "ui-icon",
        path: "{{.}}",
      },
      content: list,
    },

    {
      tag: "ui-tree.inset.paper.resize",
      style: { width: "200px", height: "300px" },
      // selection: ["/tests/fixtures/formats/example.json"],
      // itemTemplate: {
      //   content: [
      //     { tag: "ui-icon", small: true, path: "{{.}}" },
      //     { if: "{{endsWith(., '/')}}", content: "lol" },
      //   ],
      // },
      // content: list,
      selection: ["Hello"],
      content: [
        {
          label: "Foo",
          content: [
            { label: "Bar" }, //
            { label: "Baz" },
          ],
        },
        { label: "Hello" },
        { label: "World" },
      ],
    },
  ],
})
