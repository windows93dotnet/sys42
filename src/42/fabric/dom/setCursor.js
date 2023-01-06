const doc = document.documentElement

export function unsetCursor() {
  for (let i = doc.classList.length - 1; i >= 0; i--) {
    const className = doc.classList[i]
    if (className.startsWith("cursor-")) {
      doc.classList.remove(className)
    }
  }
}

export default function setCursor(cursor) {
  if (cursor) {
    cursor = `cursor-${cursor}`
    if (doc.classList.contains(cursor)) return
    unsetCursor()
    doc.classList.add(cursor)
  } else {
    unsetCursor()
  }
}
