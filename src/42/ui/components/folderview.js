import "./icon.js"
import Component from "../class/Component.js"
import selectable from "../trait/selectable.js"
import disk from "../../system/fs/disk.js"
import listen from "../../fabric/dom/listen.js"
import render from "../render.js"
import joinScope from "../utils/joinScope.js"
import removeItem from "../../fabric/type/array/removeItem.js"

export class FolderView extends Component {
  static definition = {
    tag: "ui-folderview",
    tabIndex: -1,
    properties: {
      path: {
        type: "string",
        reflect: true,
        render: true,
        default: "/",
      },
      glob: {
        type: "boolean",
        fromView: true,
        render: true,
      },
      selection: {
        state: true,
        type: "array",
        default: [],
      },
      items: {
        state: true,
        type: "array",
        default: [],
      },
    },
  }

  $create({ root, ctx }) {
    selectable(this)

    listen(this, {
      rubberbandadd: (e) => {
        if (!this.selection.includes(e.target.path)) {
          this.selection.push(e.target.path)
          for (const item of this.items) {
            if (item.path === e.target.path) {
              item.selected = true
              break
            }
          }
        }
      },
      rubberbandremove: (e) => {
        if (this.selection.includes(e.target.path)) {
          removeItem(this.selection, e.target.path)
          for (const item of this.items) {
            if (item.path === e.target.path) {
              item.selected = false
              break
            }
          }
        }
      },
    })

    const content = {
      scope: joinScope(ctx.scope, "items"),
      repeat: {
        type: "ui-icon",
        path: "{{path}}",
        aria: { selected: "{{selected}}" },
      },
    }

    root.append(render(content, ctx))
  }

  async $render() {
    if (
      !this.hasAttribute("aria-label") &&
      !this.hasAttribute("aria-labelledby")
    ) {
      this.setAttribute("aria-label", `files in ${this.path}`)
    }

    let dir
    try {
      dir = this.glob
        ? disk.glob(this.path.endsWith("*") ? this.path : this.path + "*")
        : disk.readDir(this.path, { absolute: true })
    } catch (error) {
      this.dispatchEvent(
        new ErrorEvent("patherror", {
          error,
          message: error.message,
          bubbles: true,
        })
      )
    }

    console.log(dir)

    this.items = dir.map((path) => ({
      path,
      selected: this.selection.includes(path),
    }))
  }
}

export default await Component.define(FolderView)
