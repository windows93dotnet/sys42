import listen from "../../../../fabric/event/listen.js"
import dt from "../../../../core/dt.js"
import { getIndex, getNewIndex } from "../getIndex.js"
import SlideHint from "../hints/SlideHint.js"

if (/Firefox\/\d+[\d.]*/.test(navigator.userAgent)) {
  await import("../../../../core/env/polyfills/DragEvent.prototype.clientX.js")
}

let hint
let originHint

export function dragEventDriver(trait, config) {
  let counter = 0
  let justStarted = false
  let hasLeavedDropzone = false

  const { effects, dropzone } = trait
  const { id } = dropzone
  const { signal } = trait.cancel

  /* dropzone
  =========== */

  listen(dropzone, {
    signal,
    prevent: true,

    dragover(e) {
      dt.effects.handleEffect(e, config)
      hint?.dragoverDropzone?.(e.x, e.y)
    },

    dragenter(e) {
      dt.effects.handleEffect(e, config)
      if (counter++ === 0) {
        dropzone.classList.add("dragover")

        if (hint) {
          if (hasLeavedDropzone) {
            // force index to end of the list if no item is hovered before drop
            hint.index =
              trait.list?.length ?? //
              dropzone.querySelectorAll(trait.selector).length
          }

          if (hint.id === id) {
            hint.enterDropzone?.()
          } else {
            originHint = hint
            originHint.keepGhost = true
            hint = new SlideHint({ trait, origin: originHint })
            hint.move(e.x, e.y)
          }
        }
      }
    },

    dragleave() {
      if (--counter <= 0) {
        hasLeavedDropzone = true
        counter = 0
        dropzone.classList.remove("dragover")

        if (originHint) {
          hint.destroy()
          originHint.keepGhost = false
          hint = originHint
          originHint = undefined
        }

        hint?.leaveDropzone?.()
      }
    },

    drop(e) {
      counter = 0
      dropzone.classList.remove("dragover")

      const res = dt.import(e, config)

      if (hint) {
        const { index } = hint
        trait.import({ index, dropzone, x: e.x, y: e.y, ...res })
        hint?.stop?.()
        hint = undefined
      } else {
        const item = e.target.closest(trait.selector)
        const index = getNewIndex(e.x, e.y, item, trait.orientation)
        trait.import({ index, dropzone, x: e.x, y: e.y, ...res })
      }
    },
  })

  if (!trait.selector) return

  /* draggable items
  ================== */

  listen(trait.el, {
    signal,
    selector: trait.selector,

    pointerdown(e, target) {
      // TODO: reverse this on cancel
      target.draggable = true // force draggable on elements
    },

    dragstart(e, target) {
      counter = 0
      justStarted = true
      hasLeavedDropzone = false
      const index = getIndex(target)
      dt.export(e, { effects, data: trait.export({ index, target }) })

      if (trait.config.hint.type === "slide") {
        hint = new SlideHint({ trait, x: e.x, y: e.y, target, index })
      }
    },

    drag(e) {
      if (justStarted) {
        // fast drag outside dropzone sometimes don't trigger dragleave event
        const isInDropzone = document
          .elementFromPoint(e.x, e.y)
          ?.closest(`#${id}`)
        if (!isInDropzone) hint?.leaveDropzone?.()
        justStarted = false
      }

      hint?.move?.(e.x, e.y)
    },

    dragend(e, target) {
      justStarted = false
      hasLeavedDropzone = false
      counter = 0

      for (const item of document.querySelectorAll(".dragover")) {
        item.classList.remove("dragover")
      }

      if (originHint) {
        originHint.destroy()
        originHint = undefined
      }

      const { dropEffect } = e.dataTransfer

      if (dropEffect === "move") {
        hint?.destroy?.()
        const index = getIndex(target)
        trait.remove({ x: e.x, y: e.y, index, target })
      } else hint?.revert?.()

      hint = undefined
    },
  })
}

export default dragEventDriver
