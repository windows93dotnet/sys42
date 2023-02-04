import ui from "../../../../42/ui.js"

const items = [
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

const menubar = [
  {
    label: "File",
    items: [
      {
        label: "New",
        picto: "file",
        shortcut: "Ctrl+N",
      },
      {
        label: "Open…",
        picto: "folder-open",
        shortcut: "Ctrl+O",
      },
      {
        label: "Save",
        picto: "save",
        shortcut: "Ctrl+S",
      },
      {
        label: "Save As…",
        picto: "save",
        shortcut: "Ctrl+Shift+S",
      },
      "---",
      {
        label: "Import…",
        picto: "import",
      },
      {
        label: "Export…",
        picto: "export",
      },
      "---",
      {
        $id: "exit",
        label: "Exit",
      },
    ],
  },
  {
    label: "View",
    items: [
      { label: "Empty", disabled: true }, //
    ],
  },
]

globalThis.app = ui({
  tag: "body.box-fit.box-center.desktop",
  content: {
    tag: ".flex-v.resize.pa-xs.outset.panel",
    style: { height: "350px", width: "640px" },
    content: [
      { tag: "ui-menubar", items: menubar },
      {
        tag: "ui-layout",
        content: [
          { tag: "header.pa-x-sm.inset-shallow", content: "header" },
          [
            // { tag: "aside.pa-x-sm", content: "sidebar" },
            { tag: "ui-tree.inset.paper", items },
            { tag: "ui-tabs.inset.ground", transferable: true, items },
            { tag: "ui-accordion.inset.paper", items },
          ],
          { tag: "footer.pa-x-sm.inset-shallow", content: "footer" },
        ],
      },
    ],
  },
})
