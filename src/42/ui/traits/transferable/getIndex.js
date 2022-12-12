import indexOfElement from "../../../fabric/dom/indexOfElement.js"

export function getIndex(item) {
  const index = item.style.getPropertyValue("--index")
  return index ? Number(index) : indexOfElement(item)
}

export function getNewIndex(X, Y, item, orientation) {
  if (item) {
    const index = getIndex(item)

    if (orientation === "horizontal") {
      const { x, width } = item.getBoundingClientRect()
      if (X > x + width / 2) return index + 1
    } else {
      const { y, height } = item.getBoundingClientRect()
      if (Y > y + height / 2) return index + 1
    }

    return index
  }
}

export default getIndex
