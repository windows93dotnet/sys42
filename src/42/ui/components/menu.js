import Component from "../class/Component.js"
import render from "../render.js"
import listen from "../../fabric/dom/listen.js"
import debounce from "../../fabric/type/function/debounce.js"
import { layers } from "../ui/compositor.js"

function closeMenuItems(el, options = {}) {
  const items = el.querySelectorAll(`
    :scope > li > button:not([aria-disabled="true"]),
    :scope > li > label > input:not([aria-disabled="true"])`)

  for (const item of items) {
    if (options.current === item) continue
    if (item.getAttribute("aria-expanded") === "true") {
      options.hasExpanded = true
      item.setAttribute("aria-expanded", "false")
      const id = item.getAttribute("data-controls")
      layers.popups.deleteAfter(id, { focusOpener: false })
    }
  }

  return items
}

function seq(el, dir) {
  const items = [...closeMenuItems(el)]
  const index = items.indexOf(document.activeElement)
  if (index !== -1) {
    const { length } = items
    const item = items[(index + length + dir) % length]
    item.focus()
    return item
  }
}

function openPopup(el, detail = {}) {
  const event = new CustomEvent("openpopup", { detail })
  el.dispatchEvent(event)
}

const moving = { x: 0, y: 0 }

function addMenuItemListeners(menu, el, signal, inMenubar) {
  const isFirstLevel = menu.parentNode.className !== "layer-popups"

  const options = { signal }
  const event = "pointerenter"

  if (el.localName === "label") {
    listen(el, options, {
      pointerdown(e) {
        if (el.localName === "label") {
          e.preventDefault() // don't blur on label click
          el.firstChild.focus()
        }
      },
    })
  }

  listen(el, options, {
    click() {
      if (el.getAttribute("aria-haspopup") === "menu") return
      requestAnimationFrame(() => layers.popups?.clear())
    },
    [`pointerdown ${event}`](e) {
      if (e.type === event && e.x === moving.x && e.y === moving.y) return

      moving.x = e.x
      moving.y = e.y

      if (el.localName === "label") el.firstChild.focus()
      else el.focus()

      if (el.getAttribute("aria-expanded") === "true") {
        closeMenuItems(menu, { current: el })
        const id = el.getAttribute("data-controls")
        const submenu = document.querySelector(`#${id}`)
        if (submenu) closeMenuItems(submenu)
        else {
          layers.popups.deleteAfter(id, {
            focusOpener: false,
            excludeCurrent: true,
            cursor: { x: e.x, y: e.y },
          })
        }
      } else {
        const meta = {}
        closeMenuItems(menu, meta)
        if (inMenubar && e.type === event && !meta.hasExpanded) return

        if (el.hasAttribute("aria-haspopup")) {
          openPopup(el, {
            clear: isFirstLevel ? { focusOpener: false } : false,
            cursor: { x: e.x, y: e.y },
            inMenubar,
          })
        }
      }
    },
  })
}

export class Menu extends Component {
  static definition = {
    tag: "ui-menu",
    role: "menu",
    shortcuts: [
      { key: "up", run: "focusPrev" },
      { key: "down", run: "focusNext" },
      { key: "right", run: "openCurrent" },
      { key: "left", run: "closeCurrent" },
      { key: "tab", run: "focusOut", args: "next" },
      { key: "shift+tab", run: "focusOut", args: "prev" },
    ],
  }

  focusPrev() {
    seq(this, -1)
  }

  focusNext() {
    seq(this, 1)
  }

  openCurrent() {
    const { activeElement } = document
    if (!activeElement.hasAttribute("aria-haspopup")) return
    openPopup(activeElement, { autofocus: true })
  }

  closeCurrent() {
    layers.popups.deleteAfter(this.id)
  }

  focusOut(dir = "next") {
    layers.popups.clear({ focusOut: dir })
  }

  $create({ root, ctx, content, signal }) {
    listen(
      { signal },
      {
        pointermove: debounce(({ x, y }) => {
          moving.x = x
          moving.y = y
        }),
      }
    )

    const fragment = document.createDocumentFragment()

    const inMenubar = this.constructor.name === "Menubar"

    let first = true
    for (let item of content) {
      if (item === "---" || item.type === "separator") {
        fragment.append(document.createElement("hr"))
        continue
      }

      const li = document.createElement("li")
      li.setAttribute("role", "none")

      item = { ...item }

      item.tabIndex = first ? 0 : -1
      first = false

      if ("disabled" in item) {
        item.aria ??= {}
        item.aria.disabled = item.disabled
        delete item.disabled
      }

      if (item.content) {
        item.type = "button"
        item.role = "menuitem"
        // item.id ??= uid()
        item.popup = {
          type: "ui-menu",
          content: item.content,
          // aria: { labelledby: item.id },
          aria: { label: item.label },
          inMenubar,
        }
        delete item.content
      } else if (item.type) {
        item.role =
          item.type === "checkbox"
            ? "menuitemcheckbox"
            : item.type === "radio"
            ? "menuitemradio"
            : "menuitem"
      } else {
        item.type = "button"
        item.role = "menuitem"
      }

      if (
        item.dialog &&
        typeof item.label === "string" &&
        !item.label.endsWith("…")
      ) {
        item.label += "…"
      }

      if (item.role === "menuitem" && item.shortcut) {
        item.aria ??= {}
        item.aria.keyshortcuts = item.shortcut
        item.label = [
          { type: "span", content: item.label },
          { type: "kbd", aria: { hidden: true }, content: item.shortcut },
        ]
      }

      const menuitem = render(item, ctx).firstChild
      addMenuItemListeners(this, menuitem, signal, inMenubar)
      li.append(menuitem)
      fragment.append(li)
    }

    root.append(fragment)
  }
}

export default await Component.define(Menu)
