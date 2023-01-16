import "../../../../42/ui/components/icon.js"
import ui from "../../../../42/ui.js"
import sleep from "../../../../42/fabric/type/promise/sleep.js"

import disk from "../../../../42/core/disk.js"
const list = disk
  .glob("/tests/fixtures/formats/*", {
    sort: "mimetype",
  })
  .slice(5, 10)

const content = [
  {
    label: "Lorem ipsum",
    prelabel: { tag: "ui-picto", value: "places/folder" },
    postlabel: { tag: "button.btn-clear", content: "more" },
    content:
      "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Sequi distinctio accusamus cumque labore at, corrupti ducimus, illum soluta similique earum quis facilis repellat. Laudantium, qui est, repellendus, exercitationem voluptatum distinctio enim rerum reiciendis autem assumenda aperiam suscipit quis voluptate fugiat ad magni nemo rem ratione. Repellat earum non, voluptate mollitia, a, voluptatibus accusantium consequatur rem distinctio sunt inventore ex natus. repellendus, exercitationem voluptatum distinctio enim rerum reiciendis autem assumenda aperiam suscipit quis voluptate fugiat ad magni nemo rem ratione. Repellat earum non, voluptate mollitia, a, voluptatibus accusantium consequatur rem distinctio sunt inventore ex natus.",
  },
  {
    label:
      "Laudantium molestiae nihil pariatur enim nemo minus nostrum nobis eaque, quam mollitia magni iusto",
    prelabel: { tag: "ui-picto", value: "type/audio" },
    postlabel: { tag: "button.btn-clear", content: "more" },
    content:
      "Laudantium molestiae nihil pariatur enim nemo minus nostrum nobis eaque, quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima!",
  },
  {
    label: {
      tag: "ui-icon",
      small: true,
      path: "/tests/fixtures/formats/example.json",
    },
    prelabel: { tag: "button", content: "pre" },
    postlabel: { tag: "button", content: "post" },
    content:
      "Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima! Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima! Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima!",
  },
  {
    label: "Quam mollitia magni",
    content:
      "Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima! Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima! Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima!",
  },
]

window.app = ui({
  // plugins: ["markdown", "persist"],
  plugins: ["markdown"],
  tag: "body.box-fit.box-center._gap._box-v._ground",
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

    "## Tree",
    {
      tag: "ui-tree.inset.paper.resize",
      style: { width: "256px", height: "128px" },
      items: content,
    },

    "### itemTemplate",
    {
      tag: "ui-tree.inset.paper.resize",
      style: { width: "256px", height: "128px" },
      selection: ["/tests/fixtures/formats/example.json"],
      itemTemplate: {
        content: [
          { tag: "ui-icon", small: true, path: "{{.}}" },
          // { if: "{{endsWith(., '/')}}", content: "subtree" },
        ],
      },
      items: list,
    },

    "### lazy loading",
    {
      tag: "ui-tree.inset.paper.resize",
      style: { width: "256px", height: "128px" },
      selection: ["Hello"],
      items: [
        {
          label: "Foo",
          expanded: true,
          async items() {
            await sleep(500)
            return [
              { label: "Bar" }, //
              { label: "Baz" },
              {
                label: "Derp",
                // expanded: true,
                items: [
                  {
                    label: "Foo",
                    items: [
                      { label: ["Bar", "\n\n", "Derp"] }, //
                      { label: "Baz" },
                    ],
                  },
                  { label: "Hello" },
                  { label: "World" },
                  {
                    label: "Foo",
                    items: [
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
          items: [
            { label: "Bar" }, //
            { label: "Baz" },
          ],
        },
      ],
    },
  ],
})
