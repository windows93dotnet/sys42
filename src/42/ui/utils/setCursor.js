export default function setCursor(cursor, condition = true) {
  for (let i = document.body.classList.length - 1; i >= 0; i--) {
    const className = document.body.classList[i]
    if (className.startsWith("cursor-")) {
      document.body.classList.remove(className)
    }
  }

  if (cursor) {
    cursor = `cursor-${cursor}`
    if (condition) document.body.classList.add(cursor)
    else document.body.classList.remove(cursor)
  }
}
