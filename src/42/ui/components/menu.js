import Component from "../class/Component.js"

function seq(el, dir) {
  const items = [
    ...el.querySelectorAll(`
    :scope > li > button:not([aria-disabled="true"]),
    :scope > li > label > input:not([aria-disabled="true"])`),
  ]

  const index = items.indexOf(document.activeElement)

  if (index !== -1) {
    const { length } = items
    const item = items[(index + length + dir) % length]
    item.focus()
    return item
  }
}

export class Menu extends Component {
  [Symbol.for("42_POPUP_CLOSE")] = true

  static definition = {
    tag: "ui-menu",
    role: "menu",
    on: {
      "ArrowUp": "{{focusPrev()}}",
      "ArrowDown": "{{focusNext()}}",
      "Tab": "{{_focusOut('next', e)}}",
      "Shift+Tab": "{{_focusOut('prev', e)}}",
    },
  }

  // close is implemented only for popup menu (in popup.js )
  close() {}

  _focusOut(dir, e) {
    if (this.closeAll) {
      e.preventDefault()
      this.closeAll({ focusOut: dir })
    }
  }

  focusPrev() {
    seq(this, -1)
  }

  focusNext() {
    seq(this, 1)
  }

  render({ content }) {
    const inMenubar = this.constructor.name === "Menubar"
    const items = []

    let first = true
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
        item.tabIndex = -1
      } else {
        item.tabIndex = first ? 0 : -1
        first = false
      }

      items.push({ tag: "li", role: "none", content: item })
    }

    return items
  }
}

Component.define(Menu)
