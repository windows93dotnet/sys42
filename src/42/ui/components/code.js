import Component from "../classes/Component.js"
import stringify from "../../fabric/type/any/stringify.js"
import highlight from "../../core/console/formats/highlight.js"
import logAsContent from "../../core/console/logAsContent.js"

const OPEN = `#OPEN_TEMPLATE_${42}`
const CLOSE = `#CLOSE_TEMPLATE_${42}`

export class Code extends Component {
  static plan = {
    tag: "ui-code",
    role: "none",

    props: {
      value: {
        type: "any",
      },
      escapeTemplate: false,
    },
  }

  render({ content, escapeTemplate }) {
    content = typeof content === "string" ? content : stringify.line(content)

    content = content
      .replaceAll(`{${"{"}`, OPEN) //
      .replaceAll("}}", CLOSE)

    content = highlight(content)

    content = content
      .replaceAll(OPEN, escapeTemplate ? "\\\\{\\{" : `{${"{"}`)
      .replaceAll(CLOSE, escapeTemplate ? "\\}\\}" : "}}")

    content = logAsContent(content)

    return [
      {
        tag: "pre.code.ma-0",
        content: {
          tag: "code",
          content,
        },
      },
    ]
  }
}

Component.define(Code)
