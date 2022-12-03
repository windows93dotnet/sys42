import listen from "../../../fabric/event/listen.js"
import Dragger from "../../classes/Dragger.js"
import SlideHint, { getIndex } from "./SlideHint.js"

let data
let hint
let originHint
let dropEffect = "none"

export function pointerEventDriver(trait) {
  const { /* effects, */ dropzone } = trait
  const { id } = dropzone

  const { signal } = trait.cancel

  listen(dropzone, {
    signal,

    pointermove({ x, y }) {
      if (Dragger.isDragging) {
        hint?.layout?.(x, y)
      }
    },

    pointerenter({ x, y }) {
      if (Dragger.isDragging) {
        dropzone.classList.add("dragover")
        if (hint) {
          // force index to end of the list if no item is hovered before drop
          hint.index =
            trait.list?.length ?? //
            dropzone.querySelectorAll(trait.selector).length

          if (hint.id === id) {
            hint.enterDropzone?.()
          } else {
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

    pointerleave() {
      if (Dragger.isDragging) {
        dropzone.classList.remove("dragover")

        if (originHint) {
          hint.destroy()
          hint = originHint
          originHint = undefined
        }

        hint?.leaveDropzone?.()
      }
    },

    pointerup({ x, y }) {
      if (Dragger.isDragging) {
        dropzone.classList.remove("dragover")
        dropEffect = "move"
        if (hint) {
          const { index } = hint
          trait.import({ data }, { index, dropzone, x, y })
          hint?.stop?.()
          hint = undefined
          data = undefined
        }
      }
    },
  })

  if (!trait.selector) return

  const dragger = new Dragger(trait.el, {
    signal,
    selector: trait.selector,
  })

  dragger.start = (x, y, e, target) => {
    trait.isSorting = false
    const index = getIndex(target)
    data = trait.export({ index, target })
    if (trait.config.hint === "slide") {
      hint = new SlideHint(trait, { x, y, target, index })
    }

    if (dropzone.contains(target)) {
      dropzone.classList.add("dragover")
      hint?.enterDropzone?.()
    }
  }

  dragger.drag = (x, y) => {
    hint?.update?.(x, y)
  }

  dragger.stop = (x, y, e, target) => {
    dropzone.classList.remove("dragover")

    if (originHint) {
      originHint.destroy()
      originHint = undefined
    }

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

    dropEffect = "none"
  }
}

export default pointerEventDriver
