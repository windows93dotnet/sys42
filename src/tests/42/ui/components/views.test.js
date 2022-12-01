import ui from "../../../../42/ui.js"
import disk from "../../../../42/core/disk.js"

const list = disk.glob("/tests/fixtures/**", { sort: true })

// import log from "../../../../42/core/log.js"
// log(list)

ui({
  tag: "body.box-fit.box-center._box-v._ground",
  style: { padding: "90px" },

  content: [
    {
      tag: "ui-grid.inset.paper.resize",
      style: { width: "400px", height: "400px" },
      selection: ["/tests/fixtures/formats/example.json"],
      template: {
        tag: "ui-icon",
        path: "{{.}}",
        // tag: ".bd",
        // content: "{{.}}",
      },
      content: list,
    },
    // {
    //   tag: "ui-grid.inset.paper",
    //   content: list.map((path) => ({ tag: "ui-icon", path })),
    // },
  ],
})
