import Component from "../classes/Component.js"
import stringify from "../../fabric/type/any/stringify.js"
import highlight from "../../core/console/formatters/highlight.js"
import logAsPlan from "../../core/console/logAsPlan.js"

const OPEN = `#OPEN_TEMPLATE_${42}`
const CLOSE = `#CLOSE_TEMPLATE_${42}`

export class CodeDemo extends Component {
  static plan = {
    tag: "ui-code-demo",
    role: "none",

    props: {
      value: {
        type: "any",
      },
      escapeTemplate: false,
      beforeCode: "",
      afterCode: "",
    },
  }

  render({ content, escapeTemplate, beforeCode = "", afterCode = "" }) {
    content = typeof content === "string" ? content : stringify.line(content)

    content = beforeCode + content + afterCode

    content = content
      .replaceAll(`{${"{"}`, OPEN) //
      .replaceAll("}}", CLOSE)

    content = highlight(content)

    content = content
      .replaceAll(OPEN, escapeTemplate ? "\\\\{\\{" : `{${"{"}`)
      .replaceAll(CLOSE, escapeTemplate ? "\\}\\}" : "}}")

    content = logAsPlan(content)

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

export default Component.define(CodeDemo)
