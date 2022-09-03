import Component from "../class/Component.js"
import log from "../../core/log.js"

export class Menu extends Component {
  static definition = {
    tag: "ui-menu",
    role: "menu",
  }

  render({ content }) {
    log(content)

    const inMenubar = this.constructor.name === "Menubar"
    const items = []

    for (let item of content) {
      if (item === "---") {
        items.push(item)
        continue
      }

      item = { ...item }
      const { content } = item

      if (
        item.dialog &&
        typeof item.label === "string" &&
        !item.label.endsWith("…")
      ) {
        item.label += "…"
      }

      if (content) {
        item.type = "button"
        item.role = "menuitem"
        item.popup = {
          type: "ui-menu",
          content,
          // aria: { labelledby: item.id },
          aria: { label: item.label },
          inMenubar,
        }
      } else {
        item.tag = "button"
        item.role = "menuitem"
        item.content = {
          tag: "span",
          content: item.label,
        }
      }

      delete item.label

      if ("disabled" in item) {
        item.aria ??= {}
        item.aria.disabled = item.disabled
        delete item.disabled
      }

      items.push({ tag: "li", role: "none", content: item })
    }

    return items
  }
}

Component.define(Menu)
