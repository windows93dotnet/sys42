// @read https://allyjs.io/data-tables/focusable.html
// @thanks https://stackoverflow.com/a/35173443
// @thanks https://github.com/w3c/aria-practices/blob/master/examples/js/utils.js
// @thanks https://stackoverflow.com/a/7208990

import isFocusable from "./isFocusable.js"

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
    ":scope [autofocus], :scope [data-autofocus]"
  )
  if (items.length > 0 && attemptFocus(items[items.length - 1])) return true
  return focusInsideFirst(el)
}

const { FILTER_ACCEPT, FILTER_SKIP, SHOW_ELEMENT } = NodeFilter

const acceptNode = (node) =>
  isFocusable(node) //
    ? FILTER_ACCEPT
    : FILTER_SKIP

export class TabOrder {
  constructor(base = document.body) {
    this.walker = document.createTreeWalker(base, SHOW_ELEMENT, { acceptNode })
    this.list = []
    this.scan()
  }

  scan() {
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

  first() {
    return attemptFocus(this.list.at(0))
  }

  last() {
    return attemptFocus(this.list.at(-1))
  }

  next(el = document.activeElement) {
    let index = this.list.indexOf(el)
    if (index === this.list.length - 1) index = -1
    return attemptFocus(this.list[++index])
  }

  prev(el = document.activeElement) {
    let index = this.list.indexOf(el)
    if (index === 0 || index === -1) index = this.list.length
    return attemptFocus(this.list[--index])
  }

  destroy() {
    this.list.length = 0
    this.walker = undefined
  }
}

export function focusPrev(el, base) {
  const tab = new TabOrder(base)
  const res = tab.prev(el)
  tab.destroy()
  return res
}

export function focusNext(el, base) {
  const tab = new TabOrder(base)
  const res = tab.next(el)
  tab.destroy()
  return res
}

export function focusFirst(el, base) {
  const tab = new TabOrder(base)
  const res = tab.first(el)
  tab.destroy()
  return res
}

export function focusLast(el, base) {
  const tab = new TabOrder(base)
  const res = tab.last(el)
  tab.destroy()
  return res
}

export function autofocus(el) {
  if (!el) return false
  return attemptFocus(el) || focusInside(el)
}

export default {
  isFocusable,
  autofocus,
  inside: focusInside,
  insideFirst: focusInsideFirst,
  insideLast: focusInsideLast,
  first: focusFirst,
  last: focusLast,
  prev: focusPrev,
  next: focusNext,
}
