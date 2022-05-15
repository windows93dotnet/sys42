import Component from "../class/Component.js"
import parseFilename from "../../fabric/type/path/parseFilename.js"
import theme from "../../os/theme.js"

const TREEITEM_PARENTS = new Set(["tree", "treegrid", "group"])

class Icon extends Component {
  static definition = {
    tag: "ui-icon",

    props: {
      path: {
        type: "string",
        reflect: true,
      },
      // infos: {
      //   type: "object",
      //   computed: "{{path|getInfos}}",
      // },
    },

    tabIndex: 0,
    aria: {
      // selected: true,
      description: "{{endsWith(path, '/') ?  'folder' : 'file'}}",
    },

    computed: {
      infos: "{{path|getInfos}}",
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
          content: [
            { type: "svg", content: { type: "rect" } },
            { type: "span", content: "{{stem}}" },
            { type: "span", when: "isFile && ext", content: "\u200B{{ext}}" },
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
    console.log(111, path)
    const parsed = parseFilename(path)
    parsed.image = theme.getIconImage(parsed)
    parsed.isFile = parsed.protocol === "file:"
    parsed.stem = parsed.isFile
      ? parsed.name
      : parsed.host
          .replace(/^www\./, "")
          .split(".")
          .join("\u200B.") +
        (parsed.pathname !== "/" || parsed.search
          ? parsed.pathname + parsed.search
          : "")
    return parsed
  }
}

export default await Component.define(Icon)
