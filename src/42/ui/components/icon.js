import Component from "../class/Component.js"
import parseFilename from "../../core/path/parseFilename.js"
import theme from "../../os/theme.js"

// [1] @read https://www.stefanjudis.com/blog/aria-selected-and-when-to-use-it/

const TREEITEM_PARENTS = new Set(["tree", "treegrid", "group"])
const GRIDCELL_PARENTS = new Set(["grid", "row"])

class Icon extends Component {
  static definition = {
    tag: "ui-icon",

    // tabIndex: 0, // TODO: check merge with def

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
        computed: "{{getInfos(path)}}",
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
          tag: ".ui-icon__figure",
          aria: { hidden: true },
          content: [
            {
              tag: "img.ui-icon__image",
              fetchpriority: "high",
              decoding: "async",
              src: "{{image}}",
            },
            {
              tag: ".ui-icon__mask",
              style: { "mask-image": "url({{image}})" },
            },
          ],
        },
        {
          tag: ".ui-icon__label",
          if: "{{../label}}",
          content: [
            { tag: "svg", content: { tag: "rect.ui-icon__focusring" } },
            {
              tag: ".ui-icon__text",
              content: [
                { tag: "span", content: "{{stem}}" },
                {
                  tag: "span",
                  if: "{{isFile && ext}}",
                  content: "\u200B{{ext}}",
                },
              ],
            },
          ],
        },
      ],
    },
  }

  setup() {
    const parentRole = this.parentNode.getAttribute("role")
    if (TREEITEM_PARENTS.has(parentRole)) {
      this.setAttribute("role", "treeitem")
      if (!this.hasAttribute("aria-selected")) {
        this.setAttribute("aria-selected", "false") // [1]
      }
    } else if (GRIDCELL_PARENTS.has(parentRole)) {
      this.setAttribute("role", "gridcell")
      if (!this.hasAttribute("aria-selected")) {
        this.setAttribute("aria-selected", "false") // [1]
      }
    }
  }

  getInfos(path) {
    if (path === undefined) return
    const infos = parseFilename(path, { getURIMimetype: false })
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

export default Component.define(Icon)
