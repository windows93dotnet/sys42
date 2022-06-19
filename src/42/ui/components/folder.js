import "./icon.js"
import Component from "../class/Component.js"
import dispatch from "../../fabric/dom/dispatch.js"
import disk from "../../system/fs/disk.js"
// import selectable from "../trait/selectable.js"
// import listen from "../../fabric/dom/listen.js"

export class Folder extends Component {
  static definition = {
    tag: "ui-folder",

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
        type: "array",
        default: [],
      },
      // items: {
      //   type: "array",
      //   default: [],
      //   computed: "{{path|getItems}}",
      // },
    },

    computed: {
      items: "{{path|getItems}}",
    },

    content: {
      scope: "items",
      repeat: [
        {
          tag: "ui-icon",
          path: "{{.}}",
          aria: { selected: "{{../../selection|includes(.)}}" },
        },
        "\n",
      ],
    },
  }

  getItems(path) {
    let dir
    try {
      dir = this.glob
        ? disk.glob(path.endsWith("*") ? path : path + "*")
        : disk.readDir(path, { absolute: true })
    } catch (error) {
      dir = []
      dispatch(this, error)
    }

    return dir
  }
}

export default Component.define(Folder)
