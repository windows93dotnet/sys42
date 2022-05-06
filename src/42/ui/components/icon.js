import Component from "../class/Component2.js"
// import parseFilename from "../../fabric/type/path/parseFilename.js"
// import theme from "../../os/theme.js"
// import create from "../create.js"

// const TREEITEM_PARENTS = new Set(["tree", "treegrid", "group"])

class Icon extends Component {
  static definition = {
    tag: "ui-icon",
    // tabIndex: 0,
    properties: {
      path: {
        type: "string",
        reflect: true,
      },
    },
    content: "hello {{path|parseFilename}}",
  }

  parseFilename(path) {
    console.log(path)
  }
}

export default await Component.define(Icon)
