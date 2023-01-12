import Component from "../classes/Component.js"

const dirs = {
  h: "v",
  v: "h",
}

function displayLayout(items, dir = "h") {
  const out = []

  for (const item of items) {
    if (Array.isArray(item)) {
      out.push({
        tag: `.box-${dir}`,
        content: displayLayout(item, dirs[dir]),
      })
    } else if (typeof item === "string") {
      out.push({ tag: dir === "h" ? "span" : "div", content: item })
    } else {
      out.push(item)
    }
  }

  return out
}

export class Layout extends Component {
  static definition = {
    tag: "ui-layout",
    role: "none",
    id: true,

    props: {
      content: {
        type: "array",
        default: [],
      },
    },
  }

  render() {
    return displayLayout(this.content)
  }
}

Component.define(Layout)
