import Component from "../class/Component.js"
import basename from "../../fabric/type/path/extract/basename.js"
// import parseFilename from "../../fabric/type/path/parseFilename.js"
// import theme from "../../os/theme.js"
// import create from "../create.js"

// const TREEITEM_PARENTS = new Set(["tree", "treegrid", "group"])

class Icon extends Component {
  static definition = {
    tag: "ui-icon",
    tabIndex: 0,
    props: {
      path: {
        type: "string",
        reflect: true,
      },
    },
    content: "{{path|parseFilename}}",
    // shortcuts: [{ key: "[click]", run: "ok", args: ["path"] }],
    // shortcuts: { "[click]": { run: "ok", args: ["path"] } },
  }

  parseFilename(path) {
    console.warn(path)
    return basename(path)
  }

  // ok(path) {
  //   console.log(888, path)
  // }
}

export default await Component.define(Icon)
