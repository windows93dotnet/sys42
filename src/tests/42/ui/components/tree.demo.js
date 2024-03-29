import "../../../../42/ui/components/icon.js"
import ui from "../../../../42/ui.js"
import sleep from "../../../../42/fabric/type/promise/sleep.js"
import fileIndex from "../../../../42/core/fileIndex.js"

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

async function recursiveFolders(dir) {
  const out = []
  for (const path of await fileIndex.readDir(dir, { absolute: true })) {
    const item = { label: path }
    if (path.endsWith("/")) item.items = () => recursiveFolders(path)
    out.push(item)
  }

  return out
}

window.app = await ui({
  // plugins: ["markdown", "persist"],
  plugins: ["markdown"],
  tag: "body.box-fit.box-center",

  content: [
    "## ui-tree",
    {
      tag: "ui-tree.inset.paper.resize",
      style: { width: "256px", height: "128px" },
      items: content,
    },

    "### lazy loading",

    {
      tag: "ui-tree.inset.paper.resize",
      style: { width: "256px", height: "256px" },
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
                expanded: true,
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

    "### itemTemplate",

    { tag: "text.ma-y" },

    {
      tag: "ui-tree.inset.paper.resize",
      id: "tree-demo",
      style: { width: "256px", height: "256px" },
      selection: ["/tests/fixtures/formats/example.json"],
      expandeds: ["3", "3_3_3", "3_3"],
      itemTemplate: {
        tag: "ui-icon",
        small: true,
        path: "{{label}}",
      },
      items: await recursiveFolders("/"),
    },

    { tag: "text.ma-y" },
  ],
})

// document.querySelector("#tree-demo").focusAbove("3_2")
// document.querySelector("#tree-demo").focusAbove("4_0_2")
// document.querySelector("#tree-demo").focusAbove("8")
