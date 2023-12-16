import untilNextTask from "../../../fabric/type/promise/untilNextTask.js"
import untilNextRepaint from "../../../fabric/type/promise/untilNextRepaint.js"
import defer from "../../../fabric/type/promise/defer.js"
import listen from "../../../fabric/event/listen.js"

export function fieldSink(el, options) {
  let size = options?.size ?? 0x03_ff
  let pendingEdits // debounce
  let pendingScroll // throttle
  let timerId

  const off = listen(el, {
    "keydown || pointerdown || paste"(e) {
      if (e.key === "PageDown") return // handled by scroll event
      clearTimeout(timerId)
      pendingEdits ??= defer()
      timerId = setTimeout(() => {
        pendingEdits?.resolve()
        pendingEdits = undefined
      }, 300)
    },
    "scroll"() {
      if (pendingScroll) return
      pendingScroll = defer()
      requestAnimationFrame(() => {
        pendingScroll?.resolve()
        pendingScroll = undefined
      })
    },
  })

  let isRunning = true
  function stop() {
    isRunning = false
    pendingEdits?.reject(options?.signal?.reason)
    pendingScroll?.reject(options?.signal?.reason)
    pendingEdits = undefined
    pendingScroll = undefined
    off()
  }

  options?.signal.addEventListener("abort", stop)

  let speedUp = false

  el.value = ""

  return new WritableStream({
    async write(chunk, controller) {
      for (let i = 0, l = chunk.length; i < l; i += size) {
        if (!isRunning) {
          return controller.error((options?.signal ?? controller.signal).reason)
        }

        const text = chunk.slice(i, i + size)
        const { length } = el.value
        el.setRangeText(text, length, length + text.length)

        await untilNextRepaint()

        if (el.scrollHeight > el.clientHeight) {
          if (!speedUp) size *= 10
          speedUp = true
          await untilNextTask()
        } else {
          await untilNextRepaint()
        }
      }
    },
    close() {
      stop()
    },
    abort() {
      stop()
    },
  })
}

export default fieldSink
