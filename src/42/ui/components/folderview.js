import "./icon.js"
import Component from "../class/Component.js"
// import selectable from "../trait/selectable.js"
import disk from "../../system/fs/disk.js"
// import listen from "../../fabric/dom/listen.js"
// import render from "../render.js"
// import joinScope from "../utils/joinScope.js"
// import removeItem from "../../fabric/type/array/removeItem.js"

export class FolderView extends Component {
  static definition = {
    tag: "ui-folderview",

    tabIndex: -1,

    props: {
      path: {
        type: "string",
        reflect: true,
        default: "/",
      },
      glob: {
        type: "boolean",
        fromView: true,
      },
      selection: {
        // state: true,
        type: "array",
        default: [],
      },
      items: {
        // state: true,
        type: "array",
        default: [],
        computed: "{{path|getItems}}",
      },
    },

    // computed: {
    //   items: "{{path|getItems}}",
    // },

    content: {
      scope: "items",
      repeat: {
        // type: "div",
        // content: "{{xxx}}",
        type: "ui-icon",
        path: "{{xxx}}",
        // aria: { selected: "{{selection|includes(path)}}" },
      },
    },
  }

  getItems(path) {
    let dir
    try {
      dir = this.glob
        ? disk.glob(path.endsWith("*") ? path : path + "*")
        : disk.readDir(path, { absolute: true })
    } catch (error) {
      this.dispatchEvent(
        new ErrorEvent("patherror", {
          error,
          message: error.message,
          bubbles: true,
        })
      )

      return []
    }

    console.group("getItems")
    console.log(dir.join("\n"))
    console.groupEnd()

    return dir.map((xxx) => ({ xxx }))

    // return dir

    // return dir.map((path) => ({
    //   path,
    //   // selected: this.selection.includes(path),
    // }))
  }
}

export default await Component.define(FolderView)
