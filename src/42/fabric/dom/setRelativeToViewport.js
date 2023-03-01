const { ELEMENT_NODE } = Node

export function getContainingBlock(el) {
  let parent = el.parentNode
  while (parent && parent.nodeType === ELEMENT_NODE) {
    const { translate, transform, filter, perspective, contain } =
      getComputedStyle(parent)

    if (
      translate !== "none" || // TODO: check other transform shortcuts
      transform !== "none" ||
      filter !== "none" ||
      perspective !== "none" ||
      contain === "strict" ||
      contain === "content" ||
      contain.includes("paint")
    ) {
      if (parent === document.documentElement) return
      return parent
    }

    parent = parent.parentNode
  }
}

export default function setRelativeToViewport(el, x = 0, y = 0) {
  const containingBlock = getContainingBlock(el)
  if (containingBlock) {
    // compensate for containing block different than the root element
    // @read https://dev.to/salilnaik/the-uncanny-relationship-between-position-fixed-and-transform-property-32f6
    // @read https://meyerweb.com/eric/thoughts/2011/09/12/un-fixing-fixed-elements-with-css-transforms/
    const rect = containingBlock.getBoundingClientRect()

    let { borderLeftWidth, borderTopWidth } = getComputedStyle(containingBlock)

    borderLeftWidth = Number.parseInt(borderLeftWidth, 10) | 0
    borderTopWidth = Number.parseInt(borderTopWidth, 10) | 0

    el.style.left = x - rect.left - borderLeftWidth + "px"
    el.style.top = y - rect.top - borderTopWidth + "px"
  } else {
    el.style.left = x + "px"
    el.style.top = y + "px"
  }
}
