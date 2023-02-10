import listen from "../../fabric/event/listen.js"

export function dragInsideWindow(obj) {
  let cnt = 0
  listen({
    dragenter(e) {
      if (cnt === 0) obj.start?.(e)
      cnt++
    },
    dragleave(e) {
      cnt--
      if (cnt === 0) obj.stop?.(e)
    },
    dragover(e) {
      obj.drag?.(e)
      return false
    },
    drop(e) {
      cnt = 0
      obj.stop?.(e)
      obj.drop?.(e)
      return false
    },
  })
}

export default dragInsideWindow
