import listen from "../../../fabric/event/listen.js"
import Dragger from "../../classes/Dragger.js"
import SlideHint, { getIndex, getNewIndex } from "./SlideHint.js"
import { inRect } from "../../../fabric/geometry/point.js"
import unproxy from "../../../fabric/type/object/unproxy.js"
import sanitize from "../../../fabric/dom/sanitize.js"

let data
let hint
let originHint
let dropEffect = "none"

import ipc from "../../../core/ipc.js"

export function pointerEventDriver(trait) {
  const { /* effects, */ dropzone } = trait
  const { id } = dropzone

  const { signal } = trait.cancel

  if (ipc.inTop) {
    let iframeRect
    let ghost
    let hint
    ipc.on("42_DRAGGER_START", { signal }, (res, meta) => {
      iframeRect = meta.iframe.getBoundingClientRect()
      if (res?.hint) {
        hint = res?.hint
        ghost = sanitize(res.hint.ghostHTML)
        ghost.style.opacity = 0
        document.documentElement.append(ghost)
      }
    })
    ipc.on("42_DRAGGER_DRAG", { signal }, ({ x, y }) => {
      x += iframeRect.left
      y += iframeRect.top
      ghost.style.opacity = 1
      ghost.style.translate = `
        ${x - hint.offsetX}px
        ${y - hint.offsetY}px`
    })
    ipc.on("42_DRAGGER_INSIDE_IFRAME", { signal }, () => {
      ghost.style.opacity = 0
    })
    ipc.on("42_DRAGGER_STOP", { signal }, ({ x, y }) => {
      ghost.remove()
      x += iframeRect.left
      y += iframeRect.top
      console.log(x, y, document.elementFromPoint(x, y))
    })
  }

  /* dropzone
  =========== */

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
        dropEffect = "move"

        if (hint) {
          // force index to end of the list if no item is hovered before drop
          hint.index =
            trait.list?.length ?? //
            dropzone.querySelectorAll(trait.selector).length

          if (hint.id === id) {
            hint.enterDropzone?.()
          } else {
            originHint = hint
            originHint.keepGhost = true
            hint = new SlideHint(trait, { origin: originHint })
            hint.update(x, y)
          }
        }
      }
    },

    pointerleave() {
      if (Dragger.isDragging) {
        dropzone.classList.remove("dragover")
        dropEffect = "none"

        if (originHint) {
          hint.destroy()
          originHint.keepGhost = false
          hint = originHint
          originHint = undefined
        }

        hint?.leaveDropzone?.()
      }
    },

    pointerup(e) {
      if (Dragger.isDragging) {
        dropzone.classList.remove("dragover")
        dropEffect = "move"

        if (hint) {
          const { index } = hint
          trait.import({ data }, { index, dropzone, x: e.x, y: e.y })
          hint?.stop?.()
          hint = undefined
          data = undefined
        } else {
          const item = e.target.closest(trait.selector)
          const index = getNewIndex(e.x, e.y, item, trait.orientation)
          trait.import({ data }, { index, dropzone, x: e.x, y: e.y })
        }
      }
    },
  })

  if (!trait.selector) return

  /* draggable items
  ================== */

  const dragger = new Dragger(trait.el, {
    signal,
    selector: trait.selector,
  })

  let docRect

  dragger.start = (x, y, e, target) => {
    dropEffect = "none"
    trait.isSorting = false
    const index = getIndex(target)
    data = trait.export({ index, target })
    if (trait.config.hint === "slide") {
      hint = new SlideHint(trait, { x, y, target, index })
    }

    docRect = document.documentElement.getBoundingClientRect()

    if (hint) {
      docRect = {
        top: docRect.top + hint.targetHeight,
        bottom: docRect.bottom - hint.targetHeight,
        left: docRect.left + hint.targetWidth,
        right: docRect.right - hint.targetWidth,
      }
    }

    if (ipc.inIframe) {
      let hintClone
      if (hint) {
        hintClone = {
          offsetX: hint.offsetX,
          offsetY: hint.offsetY,
          ghostHTML: hint.ghost.outerHTML,
        }
      }

      ipc.emit("42_DRAGGER_START", { hint: hintClone, data: unproxy(data) })
    }

    if (dropzone.contains(target)) {
      dropzone.classList.add("dragover")
      hint?.enterDropzone?.()
    }
  }

  let isOutsideIframe = false

  dragger.drag = (x, y) => {
    if (ipc.inIframe) {
      const point = { x, y }
      if (inRect(point, docRect)) {
        if (isOutsideIframe) {
          ipc.emit("42_DRAGGER_INSIDE_IFRAME")
          isOutsideIframe = false
        }
      } else {
        isOutsideIframe = true
        ipc.emit("42_DRAGGER_DRAG", point)
      }
    }

    hint?.update?.(x, y)
  }

  dragger.stop = (x, y, e, target) => {
    if (ipc.inIframe) {
      ipc.emit("42_DRAGGER_STOP", { x, y })
    }

    for (const item of document.querySelectorAll(".dragover")) {
      item.classList.remove("dragover")
    }

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
