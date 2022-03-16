// @read https://allyjs.io/data-tables/focusable.html
// @thanks https://stackoverflow.com/a/35173443
// @thanks https://github.com/w3c/aria-practices/blob/master/examples/js/utils.js
// @thanks https://stackoverflow.com/a/7208990

const { ELEMENT_NODE } = Node

export const isVisible = (el) =>
  Boolean(el.offsetWidth || el.offsetHeight || el.getClientRects().length > 0)

export const isFocusable = (el) => {
  if (
    el.tabIndex < 0 ||
    el.disabled ||
    el.getAttribute("aria-disabled") === "true" ||
    !isVisible(el)
  ) {
    return false
  }

  if (
    el.tabIndex > 0 ||
    (el.tabIndex === 0 && el.getAttribute("tabIndex") !== null) ||
    el.getAttribute("contenteditable") === "true"
  ) {
    return true
  }

  // prettier-ignore
  switch (el.localName) {
    case "a": return Boolean(el.href) && el.rel !== "ignore";
    case "input": return el.type !== "hidden";
    case "button":
    case "select":
    case "textarea": return true;
    default: return false;
  }
}

export const attemptFocus = (el) => {
  if (!el || el.nodeType !== ELEMENT_NODE || !isFocusable(el)) return false
  try {
    el.focus()
    if (el.localName === "input") el.select()
  } catch {}

  return document.activeElement === el
}

export const focusFirst = (el) => {
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i]
    if (attemptFocus(child) || focusFirst(child)) return true
  }

  return false
}

export const focusLast = (el) => {
  for (let i = el.children.length - 1; i >= 0; i--) {
    const child = el.children[i]
    if (attemptFocus(child) || focusLast(child)) return true
  }

  return false
}

export const autofocus = (el, target) => {
  if (target) {
    const type = typeof target
    if (type === "string") {
      target = el.querySelector(`:scope ${target}`)
      if (focusFirst(target)) return true
    }

    if (attemptFocus(target)) return true
  }

  target = el.querySelector(":scope [autofocus], :scope [data-autofocus]")
  if (attemptFocus(target)) return true
  return focusFirst(el)
}

const { FILTER_ACCEPT, FILTER_SKIP, SHOW_ELEMENT } = NodeFilter

const acceptNode = (node) =>
  isFocusable(node) //
    ? FILTER_ACCEPT
    : FILTER_SKIP

export class TabOrder {
  constructor(root = document.body) {
    this.walker = document.createTreeWalker(root, SHOW_ELEMENT, { acceptNode })
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

  next(currentElement = document.activeElement) {
    let index = this.list.indexOf(currentElement)
    if (index === this.list.length - 1) index = -1
    return attemptFocus(this.list[++index])
  }

  prev(currentElement = document.activeElement) {
    let index = this.list.indexOf(currentElement)
    if (index === 0 || index === -1) index = this.list.length
    return attemptFocus(this.list[--index])
  }

  destroy() {
    this.list.length = 0
    this.walker = undefined
  }
}

export const tabOrder = (root) => new TabOrder(root)
