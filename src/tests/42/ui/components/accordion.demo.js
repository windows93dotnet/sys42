import ui from "../../../../42/ui.js"

const content = [
  {
    label: "Lorem ipsum",
    content:
      "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Sequi distinctio accusamus cumque labore at, corrupti ducimus, illum soluta similique earum quis facilis repellat. Laudantium, qui est, repellendus, exercitationem voluptatum distinctio enim rerum reiciendis autem assumenda aperiam suscipit quis voluptate fugiat ad magni nemo rem ratione. Repellat earum non, voluptate mollitia, a, voluptatibus accusantium consequatur rem distinctio sunt inventore ex natus. repellendus, exercitationem voluptatum distinctio enim rerum reiciendis autem assumenda aperiam suscipit quis voluptate fugiat ad magni nemo rem ratione. Repellat earum non, voluptate mollitia, a, voluptatibus accusantium consequatur rem distinctio sunt inventore ex natus.",
  },
  {
    label:
      "Laudantium molestiae nihil pariatur enim nemo minus nostrum nobis eaque, quam mollitia magni iusto",
    postlabel: { tag: "button._btn-clear", content: "more" },
    content:
      "Laudantium molestiae nihil pariatur enim nemo minus nostrum nobis eaque, quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima!",
  },
  {
    label: "Quam mollitia magni",
    postlabel: { tag: "button._btn-clear", content: "more" },
    content:
      "Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima! Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima! Quam mollitia magni iusto, illum iure dolor quod vel laborum nesciunt minima!",
  },
]

ui({
  plugins: ["markdown"],
  tag: "body.box-fit.box-center",
  content: [
    "### Custom picto",
    {
      tag: ".box-v",
      style: { height: "256px", width: "256px" },
      content: {
        tag: "ui-accordion.inset",
        expanded: [0],
        style: {
          "--picto-open": "places/folder-open",
          "--picto-close": "places/folder",
        },
        content,
      },
    },
    "### multiple: false",
    {
      tag: ".box-v",
      style: { height: "256px", width: "256px" },
      content: {
        tag: "ui-accordion.inset",
        expanded: [0, 1, 2],
        multiple: false,
        content,
      },
    },
    "### multiple: false, collapsible: true",
    {
      tag: ".box-v",
      style: { height: "256px", width: "256px" },
      content: {
        tag: "ui-accordion.inset",
        expanded: [0, 1, 2],
        collapsible: true,
        multiple: false,
        content,
      },
    },
  ],
})
