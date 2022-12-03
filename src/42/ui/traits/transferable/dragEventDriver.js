import listen from "../../../fabric/event/listen.js"
import dt from "../../../core/dt.js"
import SlideHint, { getIndex, getNewIndex } from "./SlideHint.js"

if (/Firefox\/\d+[\d.]*/.test(navigator.userAgent)) {
  await import("../../../core/env/polyfills/DragEvent.prototype.clientX.js")
}

let hint
let originHint

export function dragEventDriver(trait) {
  let counter = 0
  let justStarted = false
  let hasLeavedDropzone = false

  const { effects, dropzone } = trait
  const { id } = dropzone

  /* dropzone
  =========== */

  const { signal } = trait.cancel

  listen(dropzone, {
    signal,
    prevent: true,

    dragover(e) {
      dt.effects.handleEffect(e, trait.config)
      hint?.layout?.(e.x, e.y)
    },

    dragenter(e) {
      dt.effects.handleEffect(e, trait.config)
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
            const { x, y } = e
            originHint = hint
            hint = new SlideHint(trait, {
              x,
              y,
              target: originHint.ghost,
              index: originHint.index,
            })
            hint.update(x, y)
            originHint.ghost.style.opacity = 0
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
          hint = originHint
          originHint = undefined
        }

        hint?.leaveDropzone?.()
      }
    },

    drop(e) {
      counter = 0
      dropzone.classList.remove("dragover")

      const res = dt.import(e, trait.config)

      if (hint) {
        const { index } = hint
        trait.import(res, { index, dropzone, x: e.x, y: e.y })
        hint?.stop?.()
        hint = undefined
      } else {
        const item = e.target.closest(trait.selector)
        const index = getNewIndex(e.x, e.y, item, trait.orientation)
        trait.import(res, { index, dropzone, x: e.x, y: e.y })
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
      trait.isSorting = false
      justStarted = true
      hasLeavedDropzone = false
      const index = getIndex(target)
      dt.export(e, { effects, data: trait.export({ index, target }) })

      if (trait.config.hint === "slide") {
        hint = new SlideHint(trait, { x: e.x, y: e.y, target, index })
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

      hint?.update?.(e.x, e.y)
    },

    dragend(e, target) {
      justStarted = false
      hasLeavedDropzone = false
      counter = 0
      dropzone.classList.remove("dragover")

      if (originHint) {
        originHint.destroy()
        originHint = undefined
      }

      const { dropEffect } = e.dataTransfer

      if (dropEffect === "move") hint?.destroy?.()
      else hint?.revert?.()
      hint = undefined

      if (trait.isSorting) {
        trait.isSorting = false
        return
      }

      if (dropEffect === "move") {
        const index = getIndex(target)
        trait.removeItem(index)
      }
    },
  })
}

export default dragEventDriver
