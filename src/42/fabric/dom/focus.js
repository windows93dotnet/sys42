// @read https://allyjs.io/data-tables/focusable.html
// @thanks https://stackoverflow.com/a/35173443
// @thanks https://github.com/w3c/aria-practices/blob/master/examples/js/utils.js
// @thanks https://stackoverflow.com/a/7208990

import isFocusable from "./isFocusable.js"
import ensureFocusable from "./ensureFocusable.js"

const { ELEMENT_NODE } = Node

export function attemptFocus(el, options) {
  if (
    !el ||
    el.nodeType !== ELEMENT_NODE ||
    (options?.strict !== true && !isFocusable(el))
  ) {
    return false
  }

  try {
    el.focus()
    if (el.localName === "input") el.select()
  } catch {}

  return document.activeElement === el
}

export function focusInsideFirst(el) {
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i]
    if (attemptFocus(child) || focusInsideFirst(child)) return true
  }

  return false
}

export function focusInsideLast(el) {
  for (let i = el.children.length - 1; i >= 0; i--) {
    const child = el.children[i]
    if (attemptFocus(child) || focusInsideLast(child)) return true
  }

  return false
}

export function focusInside(el) {
  const items = el.querySelectorAll(
    ":scope [autofocus], :scope [data-autofocus]",
  )
  if (items.length > 0 && attemptFocus(items[items.length - 1])) return true
  return focusInsideFirst(el)
}

const { FILTER_ACCEPT, FILTER_SKIP, SHOW_ELEMENT } = NodeFilter

const acceptNodeFn = (node) =>
  isFocusable(node) //
    ? FILTER_ACCEPT
    : FILTER_SKIP

export class TabOrder {
  constructor(root = document.body, options) {
    this.config = { loop: true, ...options }
    this.list = []

    if (this.config.selector) {
      this.update = () => {
        this.list.length = 0
        for (const node of root.querySelectorAll(this.config.selector)) {
          ensureFocusable(node)
          this.list.push(node)
        }
      }
    } else {
      const acceptNode = options?.include
        ? (node) =>
            node === options.include ||
            (!options.include.contains(node) && acceptNodeFn(node))
        : acceptNodeFn

      this.walker = document.createTreeWalker(
        root, //
        SHOW_ELEMENT,
        { acceptNode },
      )
      this.update = () => {
        this.list.length = 0
        const ordered = []
        while (this.walker.nextNode()) {
          if (this.walker.currentNode.tabIndex > 0) {
            ordered.push(this.walker.currentNode)
          } else this.list.push(this.walker.currentNode)
        }

        this.list.unshift(...ordered.sort((a, b) => a.tabIndex - b.tabIndex))
        return this
      }
    }

    this.update()
  }

  first() {
    return attemptFocus(this.list.at(0))
  }

  last() {
    return attemptFocus(this.list.at(-1))
  }

  next(el = document.activeElement) {
    let index = this.list.indexOf(el)
    if (this.config.loop && index === this.list.length - 1) index = -1
    return attemptFocus(this.list[++index])
  }

  prev(el = document.activeElement) {
    let index = this.list.indexOf(el)
    if (this.config.loop && (index === 0 || index === -1)) {
      index = this.list.length
    }

    return attemptFocus(this.list[--index])
  }

  destroy() {
    this.list.length = 0
    this.walker = undefined
  }
}

export function focusPrev(el, root) {
  const tab = new TabOrder(root, { include: el })
  const res = tab.prev(el)
  tab.destroy()
  return res
}

export function focusNext(el, root) {
  const tab = new TabOrder(root, { include: el })
  const res = tab.next(el)
  tab.destroy()
  return res
}

export function focusFirst(root) {
  const tab = new TabOrder(root)
  const res = tab.first()
  tab.destroy()
  return res
}

export function focusLast(root) {
  const tab = new TabOrder(root)
  const res = tab.last()
  tab.destroy()
  return res
}

export function autofocus(el) {
  if (!el) return false
  return attemptFocus(el) || focusInside(el)
}

export default {
  TabOrder,
  isFocusable,
  ensureFocusable,
  autofocus,
  attemptFocus,
  inside: focusInside,
  insideFirst: focusInsideFirst,
  insideLast: focusInsideLast,
  first: focusFirst,
  last: focusLast,
  prev: focusPrev,
  next: focusNext,
}
