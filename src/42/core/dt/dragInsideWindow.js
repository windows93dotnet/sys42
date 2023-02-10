import listen from "../../fabric/event/listen.js"

export function dragInsideWindow(obj) {
  let cnt = 0
  listen({
    prevent: true,
    dragenter(e) {
      e.dataTransfer.dropEffect = "none" // prevent dropEffect flickering
      if (cnt === 0) obj.start?.(e)
      cnt++
    },
    dragleave(e) {
      cnt--
      if (cnt === 0) obj.stop?.(e)
    },
    dragover(e) {
      obj.drag?.(e)
    },
    drop(e) {
      cnt = 0
      obj.stop?.(e)
      obj.drop?.(e)
    },
  })
}

export default dragInsideWindow
