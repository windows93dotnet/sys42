import traverse from "./../fabric/type/object/traverse.js"

export function extractShortcuts(items, stage) {
  const eventmap = { prevent: true }
  const on = [eventmap]
  traverse(items, (key, val, obj) => {
    if (key === "shortcut") {
      if (obj.click) {
        eventmap[val] = obj.click
        return
      }

      if (stage && obj.bind && obj.tag.startsWith("checkbox")) {
        eventmap[val] = () => {
          const loc = stage.scope + "/" + obj.bind
          const val = stage.reactive.get(loc)
          stage.reactive.set(loc, !val)
        }
      }
    }
  })

  return on
}

export default extractShortcuts
