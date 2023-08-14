/* eslint-disable complexity */
import inTop from "../../core/env/realm/inTop.js"
import Component from "../classes/Component.js"
import uid from "../../core/uid.js"
import { closeOthers } from "../popup.js"
import listen from "../../fabric/event/listen.js"
import throttle from "../../fabric/type/function/throttle.js"
import ipc from "../../core/ipc.js"
import Aim from "../classes/Aim.js"

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

/* Menu-aim
=========== */
const selector = ":is(ui-menu, ui-menubar) > li"
let listenPointermove
let forgetPointermove

if (inTop) {
  const aim = new Aim({ selector })

  listen({
    selector: "ui-menu",
    uipopupopen(e, menu) {
      const direction = menu.fromMenubar ? "vertical" : "horizontal"
      aim.shoot(menu, direction)
      menu.positionable.on("place", async () => {
        aim.shoot(menu, direction)
      })
    },
    uipopupclose(e, menu) {
      if (menu === aim.hit) aim.reset()
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
  #isMenubar
  #lastHovered

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
        "prevent": true,
        "contextmenu": false,
        "ArrowUp || ArrowLeft || PageUp": "{{focusPrev()}}",
        "ArrowDown || ArrowRight || PageDown": "{{focusNext()}}",
        "Home": "{{focusFirst()}}",
        "End": "{{focusLast()}}",
        "pointerenter || pointerleave": "{{resetLastHovered(e)}}",
      },
      {
        selector: ":scope > li",
        pointermove: "{{triggerMenuitem(target)}}",
      },
    ],

    defaults: {
      focusBack: undefined,
      shortcuts: {
        openSubmenu: "uitriggersubmenu || Enter || Space || ArrowRight",
        closeSubmenu: "uitriggersubmenu || pointerdown || ArrowLeft",
      },
    },
  }

  constructor(...args) {
    super(...args)
    this.#isMenubar = this.constructor.name === "Menubar"
  }

  get isMenubar() {
    return this.#isMenubar
  }

  resetLastHovered(e) {
    if (e.relatedTarget?.id === "menu-aim-triangle") return
    this.#lastHovered = undefined

    if (e.type === "pointerenter") {
      forgetPointermove ??= listenPointermove?.(this.stage.signal)
    } else if (e.type === "pointerleave") {
      forgetPointermove?.()
      forgetPointermove = undefined
    }
  }

  triggerMenuitem(target) {
    if (this.#lastHovered === target) return
    this.#lastHovered = target

    const item = target.querySelector(menuFocusItemSelector)

    if (inTop) {
      for (const item of this.querySelectorAll(
        ':scope > li > button[aria-expanded="true"]',
      )) {
        item.setAttribute("aria-expanded", "false")
        closeOthers(item)
      }
    }

    if (item) {
      if (item.disabled) {
        // Set the focus even on disabled items for visual feedback
        // (removing the highlight on previous item)
        item.disabled = false
        item.focus()
        item.disabled = true
        return
      }

      item.focus()

      if (item.getAttribute("aria-haspopup") === "menu") {
        item.dispatchEvent(
          new CustomEvent("uitriggersubmenu", {
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

  async render({ items, displayPicto, shortcuts, focusBack }) {
    const inMenubar = this.isMenubar
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
          // pointerdown: (e, target) => {
          //   if (target.getAttribute("aria-expanded") === "true") {
          //     this.resetLastHovered()
          //     target.setAttribute("aria-expanded", "false")
          //     closeOthers(target)
          //     target.focus()
          //   }
          //
          //   return false
          // },
          pointerdown: false,
          [shortcuts.openSubmenu]: {
            popup: {
              tag: "ui-menu",
              aria: inTop ? { labelledby: item.id } : { label },
              inMenuitem: true,
              inMenubar,
              // focusBack: item.focusBack ?? focusBack ?? inMenubar,
              focusBack: item.focusBack ?? focusBack,
              closeEvents: shortcuts.closeSubmenu,
              items: item.items,
              handler(e, { el }) {
                // prevent menuitem highlight flickering when using ArrowRight
                el.blur()
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
