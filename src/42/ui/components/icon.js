import Component from "../classes/Component.js"
import getPathInfos from "../../core/path/getPathInfos.js"
import themeManager from "../../os/managers/themeManager.js"

await themeManager.ready // TODO: remove this

class Icon extends Component {
  static plan = {
    tag: "ui-icon",

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
          if: "{{../label}}",
          tag: ".ui-icon__label",
          content: [
            { tag: "svg", content: { tag: "rect.ui-icon__focusring" } },
            {
              tag: ".ui-icon__text",
              content: [
                { tag: "span", content: "{{name}}" },
                { tag: "span", content: "\u200B{{ext}}" },
              ],
            },
          ],
        },
      ],
    },
  }

  getInfos(path) {
    if (path === undefined) return
    const infos = getPathInfos(path, { getURIMimetype: false })
    infos.image ??= themeManager.getIconPath(infos, this.small ? 16 : undefined)
    infos.description ??= infos.isDir ? "folder" : infos.isURI ? "uri" : "file"
    infos.name ??= (
      infos.isURI
        ? infos.host.replace(/^www\./, "") +
          (infos.pathname !== "/" || infos.search
            ? infos.pathname + infos.search
            : "")
        : infos.stem
    ).replaceAll(".", "\u200B.")
    return infos
  }
}

export default Component.define(Icon)
