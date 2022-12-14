const doc = document.documentElement

export default function setCursor(cursor, condition = true) {
  for (let i = doc.classList.length - 1; i >= 0; i--) {
    const className = doc.classList[i]
    if (className.startsWith("cursor-")) {
      doc.classList.remove(className)
    }
  }

  if (cursor) {
    cursor = `cursor-${cursor}`
    if (condition) doc.classList.add(cursor)
    else doc.classList.remove(cursor)
  }
}
