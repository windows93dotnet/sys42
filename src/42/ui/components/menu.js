/* eslint-disable complexity */
import inTop from "../../core/env/realm/inTop.js"
import Component from "../classes/Component.js"
import uid from "../../core/uid.js"
import { closeOthers } from "../popup.js"
import listen from "../../fabric/event/listen.js"
import throttle from "../../fabric/type/function/throttle.js"
import ipc from "../../core/ipc.js"
import MenuAim from "../classes/MenuAim.js"
import isIterable from "../../fabric/type/any/is/isIterable.js"

const menuItemSelector = `
  :scope > li > button:not(:disabled),
  :scope > li > label > input:not(:disabled)`

const menuFocusItemSelector = `
  :scope > button,
  :scope > label > input`

function focusFirst(menu) {
  const item = menu.querySelector(menuItemSelector)
  item?.focus()
  return item
}

function focusLast(menu) {
  const items = [...menu.querySelectorAll(menuItemSelector)]
  const item = items.at(-1)
  item?.focus()
  return item
}

function focusSequence(menu, dir) {
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

/* Menu aim
=========== */
const selector = ":is(ui-menu, ui-menubar) > li"
let listenPointermove
let forgetPointermove

if (inTop) {
  const aim = new MenuAim({ selector })

  listen({
    "selector": "ui-menu",
    "ui:popup.open"(e, menu) {
      const direction =
        menu.positionable.config.preset === "menuitem"
          ? "horizontal"
          : "vertical"

      aim.setTarget(menu, direction)
      menu.positionable.on("place", async () => aim.setTarget(menu, direction))
    },
    "ui:popup.close"(e, menu) {
      if (menu === aim.target) aim.reset()
    },
  })

  ipc.on("42_MENU_POINTERMOVE", ({ x, y }, { iframe }) => {
    const rect = iframe.getBoundingClientRect()
    x += rect.x
    y += rect.y
    aim.setCursor({ x, y })
  })
} else {
  listenPointermove = (signal) =>
    listen({
      signal,
      selector,
      pointermove: throttle(({ x, y }) => {
        ipc.emit("42_MENU_POINTERMOVE", { x, y })
      }, 100),
    })
}

export class Menu extends Component {
  [Symbol.for("42_POPUP_CLOSE")] = true
  #lastHovered

  static plan = {
    tag: "ui-menu",
    role: "menu",

    props: {
      opener: {
        type: "string",
      },
      expanded: {
        type: "boolean",
      },
    },

    on: [
      {
        "prevent": true,
        "contextmenu": false,
        "ArrowUp || ArrowLeft || PageUp": "{{focusPrev()}}",
        "ArrowDown || ArrowRight || PageDown": "{{focusNext()}}",
        "Home": "{{focusFirst()}}",
        "End": "{{focusLast()}}",
        "pointerenter || pointerleave": "{{resetLastHovered(e)}}",
      },
      {
        "selector": ":scope > li",
        "pointermove || pointerdown": "{{triggerMenuitem(target, e)}}",
      },
    ],

    defaults: {
      focusBack: undefined,
      shortcuts: {
        // initialExpand: "pointermove",
        initialExpand: "pointerdown",
        openSubmenu: "ui:trigger-submenu || Enter || Space || ArrowRight",
        closeSubmenu: "ui:trigger-submenu || pointerdown || ArrowLeft",
      },
    },
  }

  constructor(...args) {
    super(...args)
    this.isMenubar = this.constructor.name === "Menubar"
  }

  focusPrev() {
    focusSequence(this, -1)
  }
  focusNext() {
    focusSequence(this, 1)
  }
  focusFirst() {
    focusFirst(this)
  }
  focusLast() {
    focusLast(this)
  }

  resetLastHovered(e) {
    // if (e.target !== this) return
    if (e.relatedTarget?.id === "menu-aim-triangle") return
    this.#lastHovered = undefined

    if (e.type === "pointerenter") {
      forgetPointermove ??= listenPointermove?.(this.stage.signal)
    } else if (e.type === "pointerleave") {
      forgetPointermove?.()
      forgetPointermove = undefined
    }
  }

  #getExpandeds() {
    return this.querySelectorAll(':scope > li > button[aria-expanded="true"]')
  }

  triggerMenuitem(target, e) {
    let expandeds

    if (e?.type === "pointerdown") {
      this.#lastHovered = undefined
    }

    if (this.#lastHovered === target) return
    this.#lastHovered = target

    if (inTop) {
      expandeds ??= this.#getExpandeds()
      for (const item of expandeds) {
        item.setAttribute("aria-expanded", "false")
        closeOthers(item)
      }
    }

    const item =
      target.localName === "li"
        ? target.querySelector(menuFocusItemSelector)
        : target.getAttribute("role")?.startsWith("menuitem")
          ? target
          : undefined

    if (item) {
      if (item.disabled) {
        // Focus on the menu to remove the highlight on previous item
        this.focus({ preventScroll: true })
        return
      }

      item.focus({ preventScroll: true })

      if (!this.opener) {
        if (e?.type !== this.config.shortcuts.initialExpand) {
          // expandeds ??= this.#getExpandeds()
          // if (expandeds.length === 0) return
          if (!this.expanded) return
        }
      }

      if (item.getAttribute("aria-haspopup") === "menu") {
        item.dispatchEvent(
          new CustomEvent("ui:trigger-submenu", {
            bubbles: true,
            cancelable: true,
            detail: {
              autofocus: "menu",
              fromPointermove: true,
            },
          }),
        )
      }
    }
  }

  async render({ items, displayPicto, shortcuts, focusBack }) {
    const plan = []

    items = await (typeof items === "function" ? items(this.stage) : items)

    if (!isIterable(items)) return plan

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
        item.on ??= []
        item.on.push({
          stopPropagation: true,
          [shortcuts.openSubmenu]: {
            popup: {
              tag: "ui-menu",
              aria: inTop ? { labelledby: item.id } : { label },
              positionable: { preset: this.isMenubar ? "popup" : "menuitem" },
              focusBack: item.focusBack ?? focusBack,
              closeEvents: shortcuts.closeSubmenu,
              items: item.items,
              handler: (e, { data }) => {
                this.expanded = true
                data.then(() => {
                  this.expanded = this.matches(":hover,:focus,:focus-within")
                })
              },
            },
          },
        })

        if (!this.isMenubar) {
          item.label.push({ tag: "ui-picto", value: "right" })
        }

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
        item.tabIndex = -1
      } else {
        item.tabIndex = first ? 0 : -1
        first = false
      }

      if (this.isMenubar && displayPicto !== true) {
        delete item.picto
      }

      plan.push({ tag: "li", role: "none", content: item })
    }

    return plan
  }
}

export default Component.define(Menu)
