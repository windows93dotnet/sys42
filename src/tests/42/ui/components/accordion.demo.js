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
  tag: "body.box-fit.box-center._desktop",
  content: [
    {
      tag: ".box-v",
      style: { height: "256px", width: "256px" },
      content: [
        {
          tag: "ui-accordion.inset",
          style: {
            "--picto-open": "places/folder-open",
            "--picto-close": "places/folder",
          },
          content,
        },
      ],
    },
    // {
    //   // tag: ".flex-v",
    //   style: { height: "256px", width: "256px" },
    //   content: [
    //     {
    //       tag: "ui-accordion.inset",
    //       content,
    //     },
    //     "hello",
    //   ],
    // },
  ],
})
