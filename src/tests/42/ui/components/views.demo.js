import ui from "../../../../42/ui.js"
import disk from "../../../../42/core/disk.js"

const list = disk.glob("/tests/fixtures/**", {
  sort: "mimetype",
})
// const list = disk.glob("/tests/fixtures/formats/*", { sort: true })

// import log from "../../../../42/core/log.js"
// log(list)

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
      style: { width: "600px", height: "600px" },
      selection: ["/tests/fixtures/formats/example.json"],
      itemTemplate: {
        tag: "ui-icon",
        path: "{{.}}",
      },
      content: list,
    },

    // {
    //   tag: "ui-folder.inset.paper.resize",
    //   style: { width: "400px", height: "250px" },
    //   selection: ["/tests/fixtures/formats/example.json"],
    //   path: "/tests/fixtures/formats/",
    // },
  ],
})
