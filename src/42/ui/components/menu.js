/* eslint-disable complexity */
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

  static plan = {
    tag: "ui-menu",
    role: "menu",

    props: {
      // items: {
      //   type: "array",
      // },
      opener: {
        type: "string",
      },
    },

    on: {
      prevent: true,
      contextmenu: false,
      ArrowUp: "{{focusPrev()}}",
      ArrowDown: "{{focusNext()}}",
    },

    defaults: {
      focusBack: undefined,
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

  render({ items, displayPicto, shortcuts, focusBack }) {
    const inMenubar = this.constructor.name === "Menubar"
    const plan = []

    let first = true

    for (let item of items) {
      if (item === "---") {
        plan.push(item)
        continue
      }

      item = { ...item }
      item.id ??= uid()

      const { label } = item

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
      } else if (item.label) {
        item.label = [
          { tag: "span", content: item.label }, //
        ]
      }

      if (item.items) {
        item.tag ??= "button.ui-menu__menuitem--submenu"
        item.role = "menuitem"
        item.on = {
          [shortcuts.openSubmenu]: {
            popup: {
              tag: "ui-menu",
              aria: inTop ? { labelledby: item.id } : { label },
              inMenuitem: true,
              inMenubar,
              focusBack: item.focusBack ?? focusBack ?? inMenubar,
              closeEvents: shortcuts.closeSubmenu,
              items: item.items,
            },
          },
        }

        if (!inMenubar) item.label.push({ tag: "ui-picto", value: "right" })
        item.content = item.label
      } else if (item.tag?.startsWith("checkbox")) {
        item.role = "menuitemcheckbox"
      } else if (item.tag?.startsWith("radio")) {
        item.role = "menuitemradio"
        item.on ??= []
        item.on.push({
          "ArrowUp || ArrowDown || ArrowLeft || ArrowRight": (e) =>
            e.preventDefault(),
        })
      } else {
        item.tag ??= "button"
        item.role = "menuitem"
        item.content = item.label
      }

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

      plan.push({ tag: "li", role: "none", content: item })
    }

    return plan
  }
}

Component.define(Menu)
