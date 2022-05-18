import Component from "../class/Component.js"
import parseFilename from "../../fabric/type/path/parseFilename.js"
import theme from "../../os/theme.js"

const TREEITEM_PARENTS = new Set(["tree", "treegrid", "group"])

class Icon extends Component {
  static definition = {
    tag: "ui-icon",

    tabIndex: 0,
    aria: {
      description: "{{infos.description}}",
    },

    props: {
      path: {
        type: "string",
        reflect: true,
      },
      infos: {
        type: "object",
        computed: "{{path|getInfos}}",
      },
      small: {
        type: "boolean",
        reflect: true,
      },
      label: {
        type: "boolean",
        reflect: true,
        default: true,
      },
    },

    content: {
      scope: "infos",
      content: [
        {
          type: ".ui-icon__figure",
          aria: { hidden: true },
          content: [
            {
              type: "img.ui-icon__image",
              src: "{{image}}",
            },
            {
              type: ".ui-icon__mask",
              style: { "mask-image": "url({{image}})" },
            },
          ],
        },
        {
          type: ".ui-icon__label",
          when: "{{label}}",
          content: [
            { type: "svg", content: { type: "rect" } },
            { type: "span", content: "{{stem}}" },
            {
              type: "span",
              when: "{{isFile && ext}}",
              content: "\u200B{{ext}}",
            },
          ],
        },
      ],
    },
  }

  prerender() {
    const parentRole = this.parentNode.getAttribute("role")
    if (TREEITEM_PARENTS.has(parentRole)) {
      this.setAttribute("role", "treeitem")
      this.setAttribute("aria-selected", "false")
    } else {
      this.setAttribute("role", "button")
    }
  }

  getInfos(path) {
    const infos = parseFilename(path)
    infos.image = theme.getIconImage(infos)
    infos.description = infos.isDir ? "folder" : infos.isURI ? "uri" : "file"
    infos.stem = (
      infos.isURI
        ? infos.host.replace(/^www\./, "") +
          (infos.pathname !== "/" || infos.query
            ? infos.pathname + infos.query
            : "")
        : infos.name
    ).replaceAll(".", "\u200B.")
    return infos
  }
}

export default await Component.define(Icon)
