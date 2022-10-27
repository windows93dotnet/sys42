import inTop from "../../core/env/realm/inTop.js"
import Component from "../classes/Component.js"
import uid from "../../core/uid.js"

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
      prevent: true,
      contextmenu: false,
      ArrowUp: "{{focusPrev()}}",
      ArrowDown: "{{focusNext()}}",
    },
    defaults: {
      shortcuts: {
        openSubmenu: "pointerdown || Enter || Space || ArrowRight",
        closeSubmenu: "pointerdown || ArrowLeft",
      },
    },
  }

  focusPrev() {
    seq(this, -1)
  }

  focusNext() {
    seq(this, 1)
  }

  render({ content, displayPicto, shortcuts }) {
    const inMenubar = this.constructor.name === "Menubar"
    const items = []

    let first = true

    for (let item of content) {
      if (item === "---") {
        items.push(item)
        continue
      }

      item = { ...item }
      item.id ??= uid()

      const { content, label } = item

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
        item.label = [
          { tag: "span", content: item.label }, //
        ]
      }

      if (content) {
        item.tag = "button.ui-menu__menuitem--submenu"
        item.role = "menuitem"
        item.on = {
          [shortcuts.openSubmenu]: {
            popup: {
              tag: "ui-menu",
              aria: inTop ? { labelledby: item.id } : { label },
              inMenuitem: true,
              inMenubar,
              closeEvents: shortcuts.closeSubmenu,
              content,
            },
          },
        }

        if (!inMenubar) item.label.push({ tag: "ui-picto", value: "right" })
        item.content = item.label
      } else if (item.tag === "checkbox") {
        item.role = "menuitemcheckbox"
      } else if (item.tag === "radio") {
        item.role = "menuitemradio"
        item.on ??= []
        item.on.push({
          "ArrowUp || ArrowDown || ArrowLeft || ArrowRight": (e) =>
            e.preventDefault(),
        })
      } else {
        item.tag = "button"
        item.role = "menuitem"
        item.content = item.label
      }

      delete item.label

      if (item.disabled) {
        item.aria ??= {}
        item.aria.disabled = item.disabled
        delete item.disabled
        item.tabIndex = -1
      } else {
        item.tabIndex = first ? 0 : -1
        first = false
      }

      if (inMenubar && displayPicto !== true) {
        delete item.picto
      }

      items.push({ tag: "li", role: "none", content: item })
    }

    return items
  }
}

Component.define(Menu)
