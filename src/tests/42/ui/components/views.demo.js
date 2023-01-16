import ui from "../../../../42/ui.js"
import sleep from "../../../../42/fabric/type/promise/sleep.js"

import disk from "../../../../42/core/disk.js"
const list = disk.glob("/tests/fixtures/formats/*", {
  sort: "mimetype",
})

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
    label: "Quam mollitia magni",
    content:
      "Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima! Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima! Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima!",
  },
]

window.app = ui({
  // plugins: ["persist"],
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

    // {
    //   tag: "ui-tree.inset.paper.resize",
    //   style: { width: "200px", height: "200px" },
    //   selection: ["/tests/fixtures/formats/example.json"],
    //   // itemTemplate: {
    //   //   content: [
    //   //     { tag: "ui-icon", small: true, path: "{{.}}" },
    //   //     { if: "{{endsWith(., '/')}}", content: "subtree" },
    //   //   ],
    //   // },
    //   // content: list,
    //   content,
    //   // content: [
    //   //   { label: { content: "Hello", picto: "puzzle" } },
    //   //   {
    //   //     label:
    //   //       "Laudantium molestiae nihil pariatur enim nemo minus nostrum nobis eaque, quam mollitia magni iusto",
    //   //     postlabel: { tag: "button", content: "more" },
    //   //   },
    //   //   {
    //   //     label: "Subtree",
    //   //     content: [
    //   //       { label: "Bar" }, //
    //   //       { label: "Baz" },
    //   //     ],
    //   //   },
    //   // ],
    // },

    {
      tag: "ui-tree.inset.paper.resize",
      style: { width: "200px", height: "200px" },
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
