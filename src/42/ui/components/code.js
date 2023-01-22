import Component from "../classes/Component.js"
import stringify from "../../fabric/type/any/stringify.js"
import highlight from "../../core/console/formats/highlight.js"
import logAsContent from "../../core/console/logAsContent.js"

export class Code extends Component {
  static plan = {
    tag: "ui-code",
    role: "none",

    props: {
      value: {
        type: "any",
      },
    },
  }

  render({ content }) {
    return [
      {
        tag: "pre.code.ma-0",
        content: {
          tag: "code",
          content: logAsContent(
            highlight(
              typeof content === "string" ? content : stringify.line(content)
            )
          ),
        },
      },
    ]
  }
}

Component.define(Code)
