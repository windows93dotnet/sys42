import traverse from "./../fabric/type/object/traverse.js"

export function extractShortcuts(items) {
  const on = []
  traverse(items, (key, val, obj) => {
    if (key === "shortcut") {
      on.push({
        prevent: true,
        [val]: obj.click,
      })
    }
  })
  return on
}

export default extractShortcuts
