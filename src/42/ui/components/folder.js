import "./icon.js"
import Component from "../class/Component.js"
import dispatch from "../../fabric/dom/dispatch.js"
import disk from "../../core/fs/disk.js"

export class Folder extends Component {
  static definition = {
    tag: "ui-folder",

    tabIndex: -1,

    props: {
      path: {
        type: "string",
        reflect: true,
        default: "/",
        update(init) {
          if (!init) this.selection.length = 0
        },
      },
      glob: {
        type: "boolean",
        fromView: true,
      },
      selection: {
        type: "array",
        default: [],
      },
    },

    computed: {
      items: "{{getItems(path)}}",
    },

    content: {
      scope: "items",
      each: {
        tag: "ui-icon",
        path: "{{.}}",
        aria: { selected: "{{includes(../../selection, .)}}" },
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
      dir = []
      dispatch(this, error)
    }

    return dir
  }
}

export default Component.define(Folder)
