import repaint from "../promise/repaint.js"
import idle from "../promise/idle.js"
import listen from "../../event/listen.js"
import defer from "../promise/defer.js"

export default function sinkField(el, options) {
  const size = options?.size ?? 0x03_ff
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
    pendingEdits?.reject(options?.signal.reason)
    pendingScroll?.reject(options?.signal.reason)
    pendingEdits = undefined
    pendingScroll = undefined
    off()
  }

  options?.signal.addEventListener("abort", stop)

  return new WritableStream({
    async write(chunk, controller) {
      for (let i = 0, l = chunk.length; i < l; i += size) {
        if (!isRunning) {
          return controller.error((options?.signal ?? controller.signal).reason)
        }

        await Promise.all([pendingEdits, pendingScroll, repaint()])
        const { length } = el.value
        const text = chunk.slice(i, i + size)
        el.setRangeText(text, length, length + text.length)
        await idle()
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
