import "../../../../42/ui/components/icon.js"
import ui from "../../../../42/ui.js"
import fileIndex from "../../../../42/core/fileIndex.js"

const items = fileIndex.glob("/tests/fixtures/**/*", {
  sort: "mimetype",
})

window.app = ui({
  // plugins: ["markdown", "persist"],
  plugins: ["markdown"],
  tag: "body.box-fit.box-center._gap._box-v._ground",
  style: { padding: "90px" },

  content: [
    "## ui-grid",

    // {
    //   tag: "ui-grid.inset.paper",
    //   style: { width: "400px", height: "250px" },
    //   items: items.map((path) => ({ tag: "ui-icon", path })),
    // },

    {
      tag: "ui-grid.inset.paper.resize",
      style: { width: "512px", height: "512px" },
      selection: ["/tests/fixtures/formats/example.json"],
      selectionKey: "path",
      itemTemplate: {
        tag: "ui-icon",
        path: "{{.}}",
      },
      items,
    },
  ],
})
