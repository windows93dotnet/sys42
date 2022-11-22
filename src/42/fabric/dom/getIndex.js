export function getIndex(el) {
  if (!el?.parentNode) return -1

  const { children } = el.parentNode

  let i = 0
  for (; i < children.length; i++) {
    if (children[i] === el) return i
  }

  return -1
}

export default getIndex
