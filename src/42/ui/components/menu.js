import Component from "../class/Component.js"

export class Menu extends Component {
  static definition = {
    tag: "ui-menu",
    role: "menu",
  }

  render({ content }) {
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

      if (item.shortcut) {
        item.aria ??= {}
        item.aria.keyshortcuts = item.shortcut
        item.label = [
          { tag: "span", content: item.label },
          { tag: "kbd", aria: { hidden: true }, content: item.shortcut },
        ]
      } else {
        item.label = {
          tag: "span",
          content: item.label,
        }
      }

      if (content) {
        item.tag = "button"
        item.role = "menuitem"
        item.content = item.label
        item.menu = {
          content,
          // aria: { labelledby: item.id },
          // aria: { label: item.label },
          inMenuitem: true,
          inMenubar,
        }
      } else {
        item.tag = "button"
        item.role = "menuitem"
        item.content = item.label
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
