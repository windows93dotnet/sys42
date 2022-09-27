import modal from "./modal.js"
import uid from "../../core/uid.js"
import listen from "../../fabric/event/listen.js"
import defer from "../../fabric/type/promise/defer.js"
import bytesize from "../../fabric/type/file/bytesize.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"

const DEFAULT = {
  label: "{{label}}",
  class: "dialog-modal dialog-progress",
  agree: false,
}

export default function progress(total, options) {
  if (total && typeof total === "object") {
    options = total
    total = options.total
  }

  const config = { ...DEFAULT, ...options }

  const id = uid()

  config.content = {
    tag: ".box-center-y.pa-md",
    content: [
      {
        tag: ".box-h",
        content: [
          { tag: "progress", max: 100, id, value: "{{value}}" },
          {
            tag: "div.font-mono.pt-sm",
            aria: { live: "off" },
            content: "{{description}}",
          },
          config.afterfield,
        ],
      },
    ],
  }

  config.dialog = {
    id: uid(),
    state: {
      label: "Progress",
      description: "",
      value: 0,
    },
  }

  const deferred = defer()
  let running = false
  let signal
  let state
  let el

  const forget = listen({
    uidialogopen(e, target) {
      if (target.id === config.dialog.id) {
        state = target.ctx.state
        signal = target.ctx.signal
        running = true
        el = target
        deferred.resolve(state)
        forget()
      }
    },
  })

  const done = modal(config)

  let bytes = 0
  const update = paintThrottle(() => {
    if (!running) return
    const p = (100 * bytes) / total
    state.label = `Progress - ${Math.round(p)}%`
    state.value = p
    state.description = `\
${bytesize(bytes)} / \
${bytesize(total)}`
  })

  const ts = new TransformStream({
    async transform(chunk, controller) {
      if (signal?.aborted) {
        running = false
        return controller.error(signal.reason)
      }

      bytes += chunk.length
      update()
      controller.enqueue(chunk)
    },
    async flush() {
      running = false
      if (config?.keep !== true) {
        await deferred
        el?.close()
      }
    },
  })

  return Object.assign(ts, {
    state: deferred,
    done,
  })
}