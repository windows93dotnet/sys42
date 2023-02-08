import Component from "../classes/Component.js"
import getPathInfos from "../../core/path/getPathInfos.js"
import fs from "../../core/fs.js"
import themeManager from "../../os/managers/themeManager.js"
import mimetypesManager from "../../os/managers/mimetypesManager.js"

let ready

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
  }

  render() {
    const image = this.small ? "infos.image16x16" : "infos.image"
    return [
      {
        tag: ".ui-icon__figure",
        aria: { hidden: true },
        content: [
          {
            tag: "img.ui-icon__image",
            fetchpriority: "high",
            decoding: "async",
            src: `{{${image}}}`,
          },
          {
            tag: ".ui-icon__mask",
            style: { "mask-image": `url({{${image}}})` },
          },
        ],
      },
      {
        if: "{{label}}",
        tag: ".ui-icon__label",
        content: [
          { tag: "span.ui-icon__name", content: "{{infos.name}}" },
          { tag: "span.ui-icon__ext", content: "\u200B{{infos.ext}}" },
        ],
      },
    ]
  }

  async getInfos(path) {
    if (path === undefined) return

    if (!ready) {
      const undones = Promise.all([themeManager.ready, mimetypesManager.ready])
      this.stage.waitlistPending.push(undones)
      await undones
      ready = true
    }

    const infos = getPathInfos(path, {
      getURIMimetype: false,
      parseMimetype: false,
    })

    const m = infos.isURI
      ? undefined
      : mimetypesManager.extnames[infos.ext] ??
        mimetypesManager.basenames[infos.base]
    if (m) {
      infos.mimetype = m.mimetype
      infos.mime = mimetypesManager.parse(m.mimetype)
    } else {
      infos.mime = mimetypesManager.parse(infos.mimetype)
    }

    if (this.small) {
      infos.image16x16 ??= await fs.getURL(
        await themeManager.getIconPath(infos, "16x16")
      )
    } else {
      infos.image ??= await fs.getURL(await themeManager.getIconPath(infos))
    }

    if (infos.isURI) infos.ext = ""

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
