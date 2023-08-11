/* eslint-disable complexity */
import inTop from "../../core/env/realm/inTop.js"
import Component from "../classes/Component.js"
import uid from "../../core/uid.js"
// import { openPopup } from "../popup.js"
// import aim from "../../fabric/dom/aim.js"

const menuItemSelector = `
  :scope > li > button:not([aria-disabled="true"]),
  :scope > li > label > input:not([aria-disabled="true"])`

const menuFocusItemSelector = menuItemSelector.replaceAll(
  ":scope > li > ",
  ":scope > ",
)

function seq(menu, dir) {
  const items = [...menu.querySelectorAll(menuItemSelector)]

  if (document.activeElement === menu) {
    const item = dir > 0 ? items.at(dir - 1) : items.at(dir)
    item?.focus()
    return item
  }

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
  #inMenubar
  #lastHoverTarget

  static plan = {
    tag: "ui-menu",
    role: "menu",

    props: {
      opener: {
        type: "string",
      },
    },

    on: [
      {
        prevent: true,
        contextmenu: false,
        ArrowUp: "{{focusPrev()}}",
        ArrowDown: "{{focusNext()}}",
        pointerleave: "{{resetHover()}}",
      },
      {
        selector: ":scope > li",
        pointermove: "{{focusMenuitem(e, target)}}",
      },
    ],

    defaults: {
      focusBack: undefined,
      shortcuts: {
        openSubmenu: "uiopensubmenu || Enter || Space || ArrowRight",
        closeSubmenu: "uiopensubmenu || pointerdown || ArrowLeft",
      },
    },
  }

  resetHover() {
    this.#lastHoverTarget = undefined
  }

  focusMenuitem(e, target) {
    if (this.#lastHoverTarget === target) return
    this.#lastHoverTarget = target
    const item = target.querySelector(menuFocusItemSelector)
    if (item) {
      window.focus()
      item.focus()

      if (item.getAttribute("aria-haspopup") === "menu") {
        item.dispatchEvent(
          new CustomEvent("uiopensubmenu", {
            bubbles: true,
            cancelable: true,
            detail: {
              autofocus: "menu",
              fromPointermove: true,
            },
          }),
        )
      } else {
        // const item = this.querySelector(
        //   ':scope > li > button[aria-expanded="true"]',
        // )
        // item?.dispatchEvent(
        //   new CustomEvent("uiopensubmenu", {
        //     bubbles: true,
        //     cancelable: true,
        //   }),
        // )
      }
    }
  }

  focusPrev() {
    seq(this, -1)
  }

  focusNext() {
    seq(this, 1)
  }

  async render({ items, displayPicto, shortcuts, focusBack }) {
    const inMenubar = this.constructor.name === "Menubar"
    this.#inMenubar = inMenubar
    const plan = []

    let first = true

    items = await (typeof items === "function" ? items(this.stage) : items)

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
        item.on ??= []
        item.on.push({
          pointerdown: false,
          [shortcuts.openSubmenu]: {
            popup: {
              tag: "ui-menu",
              aria: inTop ? { labelledby: item.id } : { label },
              inMenuitem: true,
              inMenubar,
              focusBack: item.focusBack ?? focusBack ?? inMenubar,
              closeEvents: shortcuts.closeSubmenu,
              items: item.items,
              handler: () => {
                this.pointing = false
              },
            },
          },
        })

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

export default Component.define(Menu)
