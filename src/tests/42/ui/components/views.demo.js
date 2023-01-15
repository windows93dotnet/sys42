import ui from "../../../../42/ui.js"
import sleep from "../../../../42/fabric/type/promise/sleep.js"

import disk from "../../../../42/core/disk.js"
const list = disk.glob("/tests/fixtures/formats/*", {
  sort: "mimetype",
})

window.app = ui({
  tag: "body.box-fit.box-center.gap._box-v._ground",
  style: { padding: "90px" },

  content: [
    // {
    //   tag: "ui-grid.inset.paper",
    //   style: { width: "400px", height: "250px" },
    //   content: list.map((path) => ({ tag: "ui-icon", path })),
    // },

    // {
    //   tag: "ui-grid.inset.paper.resize",
    //   style: { width: "300px", height: "300px" },
    //   selection: ["/tests/fixtures/formats/example.json"],
    //   selectionKey: "path",
    //   itemTemplate: {
    //     tag: "ui-icon",
    //     path: "{{.}}",
    //   },
    //   content: list,
    // },

    {
      tag: "ui-tree.inset.paper.resize",
      style: { width: "200px", height: "300px" },
      // selection: ["/tests/fixtures/formats/example.json"],
      // itemTemplate: {
      //   content: [
      //     { tag: "ui-icon", small: true, path: "{{.}}" },
      //     { if: "{{endsWith(., '/')}}", content: "subtree" },
      //   ],
      // },
      // content: list,
      selection: ["Hello"],
      content: [
        {
          label: "Foo",
          expanded: true,
          async content() {
            await sleep(500)
            return [
              { label: "Bar" }, //
              { label: "Baz" },
              {
                label: "Derp",
                // expanded: true,
                content: [
                  {
                    label: "Foo",
                    content: [
                      { label: ["Bar", "\n\n", "Derp"] }, //
                      { label: "Baz" },
                    ],
                  },
                  { label: "Hello" },
                  { label: "World" },
                  {
                    label: "Foo",
                    content: [
                      { label: "Bar" }, //
                      { label: "Baz" },
                    ],
                  },
                ],
              },
            ]
          },
        },
        { label: "Hello" },
        { label: "World" },
        {
          label: "Subtree",
          content: [
            { label: "Bar" }, //
            { label: "Baz" },
          ],
        },
      ],
    },
  ],
})
