import traverse from "./../fabric/type/object/traverse.js"

export function extractShortcuts(items) {
  const eventmap = { prevent: true }
  const on = [eventmap]
  traverse(items, (key, val, obj) => {
    if (key === "shortcut" && obj.click) {
      eventmap[val] = obj.click
    }
  })

  return on
}

export default extractShortcuts
