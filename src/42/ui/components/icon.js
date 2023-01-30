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
              src: "{{../small ? imageSmall : imageNormal}}",
            },
            {
              tag: ".ui-icon__mask",
              style: {
                "mask-image": "url({{../small ? imageSmall : imageNormal}})",
              },
            },
          ],
        },
        {
          if: "{{../label}}",
          tag: ".ui-icon__label",
          content: [
            { tag: "span.ui-icon__name", content: "{{name}}" },
            { tag: "span.ui-icon__ext", content: "\u200B{{ext}}" },
          ],
        },
      ],
    },
  }

  getInfos(path) {
    if (path === undefined) return
    const infos = getPathInfos(path, { getURIMimetype: false })

    if (this.small) {
      infos.imageSmall ??= themeManager.getIconPath(infos, 16)
    } else {
      infos.imageNormal ??= themeManager.getIconPath(infos)
    }

    infos.image = this.small ? infos.imageSmall : infos.imageNormal

    infos.description ??= infos.isDir ? "folder" : infos.isURI ? "uri" : "file"
    if (infos.isURI) infos.ext = ""
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
