import repaint from "../promise/repaint.js"
import idle from "../promise/idle.js"
import listen from "../../event/listen.js"
import defer from "../promise/defer.js"

export default function sinkField(el) {
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
      }, 100)
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
  return new WritableStream(
    {
      async write(chunk) {
        await Promise.all([pendingEdits, pendingScroll, repaint()])

        const { length } = el.value
        el.setRangeText(chunk, length, length + chunk.length)
        await idle()
      },
      close() {
        off()
        console.log("close")
      },
    },
    { highWaterMark: 1 }
  )
}
