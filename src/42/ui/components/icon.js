import Component from "../class/Component.js"
import parseFilename from "../../fabric/type/path/parseFilename.js"
import parseMimetype from "../../fabric/type/file/parseMimetype.js"
import theme from "../../os/theme.js"
import create from "../create.js"

const TREEITEM_PARENTS = new Set(["tree", "treegrid", "group"])

class Icon extends Component {
  static definition = {
    tag: "ui-icon",
    tabIndex: 0,
    properties: {
      path: {
        type: "string",
        reflect: true,
        render: true,
      },
    },
  }

  $create() {
    const parentRole = this.parentNode.getAttribute("role")
    if (TREEITEM_PARENTS.has(parentRole)) {
      this.setAttribute("role", "treeitem")
      this.setAttribute("aria-selected", "false")
    } else {
      this.setAttribute("role", "button")
    }
  }

  $render() {
    let label = create("span", "\u200B")

    const image = create("img.ui-icon__image")
    const mask = create("span.ui-icon__mask")

    if (this.path) {
      this._.parsed = parseFilename(this.path, false)
      Object.assign(this._.parsed, parseMimetype(this._.parsed.mimetype))

      const src = theme.getIconImage(this._.parsed)
      if (src) {
        image.src = src
        mask.style.cssText = `
          mask-image: url("${src}");
          -webkit-mask-image: url("${src}");`
      }

      const isFile = this._.parsed.protocol === "file:"
      const labelText = isFile
        ? this._.parsed.name
        : this._.parsed.host
            .replace(/^www\./, "")
            .split(".")
            .join("\u200B.") +
          (this._.parsed.pathname !== "/" || this._.parsed.search
            ? this._.parsed.pathname + this._.parsed.search
            : "")

      label = [create("span", labelText)]

      if (isFile && this._.parsed.ext) {
        label.push(create("span", `\u200B.${this._.parsed.ext}`))
      }

      this.setAttribute(
        "aria-description",
        this.path.endsWith("/") ? "folder" : "file"
      )
    }

    this.replaceChildren(
      create("span.ui-icon__figure", { aria: { hidden: true } }, image, mask),
      create("span.ui-icon__label", create("svg", create("rect")), label)
    )
  }
}

export default await Component.define(Icon)
