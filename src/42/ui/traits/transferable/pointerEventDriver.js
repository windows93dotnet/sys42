import listen from "../../../fabric/event/listen.js"
import Dragger from "../../classes/Dragger.js"
import SlideHint, { getIndex, getNewIndex } from "./SlideHint.js"
import { inRect } from "../../../fabric/geometry/point.js"
import unproxy from "../../../fabric/type/object/unproxy.js"
import sanitize from "../../../fabric/dom/sanitize.js"
import ipc from "../../../core/ipc.js"

let data
let hint
let originHint
let outsideIframe
let iframeRect
let dropEffect = "none"

function cleanup() {
  for (const item of document.querySelectorAll(".dragover")) {
    item.classList.remove("dragover")
  }

  if (originHint) {
    originHint.destroy()
    originHint = undefined
  }
}

const dropzones = new Set()

if (ipc.inTop) {
  ipc.on("42_DRAGGER_STOP", ({ x, y }) => {
    cleanup()

    if (outsideIframe) {
      x += iframeRect.left
      y += iframeRect.top
      const target = document.elementFromPoint(x, y)
      for (const { dropzone, pointerup } of dropzones) {
        if (dropzone.contains(target)) {
          pointerup({ target, x, y })
        } else hint?.destroy()
      }
    } else {
      hint?.destroy()
    }

    hint = undefined
    data = undefined
    iframeRect = undefined

    outsideIframe = false
    Dragger.isDragging = false

    return dropEffect
  })
}

export function pointerEventDriver(trait) {
  const { /* effects, */ dropzone } = trait
  const { id } = dropzone

  const { signal } = trait.cancel

  /* dropzone
  =========== */

  const events = {
    signal,

    pointermove({ x, y }) {
      if (Dragger.isDragging) {
        hint?.layout?.(x, y)
      }
    },

    pointerenter({ x, y }) {
      if (outsideIframe) return

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
  }

  listen(dropzone, events)

  /* drag from iframe
  =================== */
  const instance = { dropzone, pointerup: events.pointerup }
  dropzones.add(instance)
  signal.addEventListener("abort", () => dropzones.delete(instance))

  if (ipc.inTop) {
    let insideTopDropzone

    ipc.on("42_DRAGGER_START", { signal }, (res, meta) => {
      if (iframeRect) return
      Dragger.isDragging = true

      iframeRect = meta.iframe.getBoundingClientRect()
      data = res.data

      if (res?.origin && trait.config.hint === "slide") {
        const { origin } = res
        origin.ghost = sanitize(origin.ghostHTML)
        hint = new SlideHint(trait, { origin })
        hint.keepGhost = false
        hint.id = origin.id

        hint.ghost.style.opacity = 0
        document.documentElement.append(hint.ghost)
      }
    })

    ipc.on("42_DRAGGER_OUTSIDE", { signal }, (point) => {
      point = { ...point }
      outsideIframe = true

      if (point.insideIframeDropzone) {
        hint.ghost.style.opacity = 0
        return
      }

      point.x += iframeRect.left
      point.y += iframeRect.top

      if (hint) {
        hint.ghost.style.opacity = 1
        hint.update(point.x, point.y)
      }

      const target = document.elementFromPoint(point.x, point.y)

      if (dropzone.contains(target)) {
        if (!insideTopDropzone) {
          insideTopDropzone = true
          outsideIframe = false
          events.pointerenter(point)
          outsideIframe = true
        }

        hint?.layout?.(point.x, point.y)
      } else if (insideTopDropzone) {
        insideTopDropzone = false
        events.pointerleave()
      }
    })

    ipc.on("42_DRAGGER_INSIDE", { signal }, () => {
      outsideIframe = false
      hint.ghost.style.opacity = 0
    })
  }

  if (!trait.selector) return

  /* draggable items
  ================== */

  let docRect
  let isOutsideIframe = false

  const dragger = new Dragger(trait.el, {
    signal,
    selector: trait.selector,
  })

  dragger.start = (x, y, e, target) => {
    dropEffect = "none"
    trait.isSorting = false
    const index = getIndex(target)
    data = trait.export({ index, target })
    if (trait.config.hint === "slide") {
      hint = new SlideHint(trait, { x, y, target, index })
    }

    if (ipc.inIframe) {
      docRect = document.documentElement.getBoundingClientRect()

      if (hint) {
        docRect = {
          top: docRect.top + hint.targetHeight,
          bottom: docRect.bottom - hint.targetHeight,
          left: docRect.left + hint.targetWidth,
          right: docRect.right - hint.targetWidth,
        }
      }

      let origin
      if (hint) {
        origin = SlideHint.cloneHint(hint)
        origin.ghostHTML = hint.ghost.outerHTML
        origin.id = id
        delete origin.ghost
      }

      ipc.emit("42_DRAGGER_START", { origin, data: unproxy(data) })
    }

    if (dropzone.contains(target)) {
      dropzone.classList.add("dragover")
      hint?.enterDropzone?.()
    }
  }

  dragger.drag = (x, y) => {
    if (ipc.inIframe) {
      const point = { x, y }
      if (inRect(point, docRect)) {
        if (isOutsideIframe) {
          ipc.emit("42_DRAGGER_INSIDE")
          isOutsideIframe = false
        }
      } else {
        isOutsideIframe = true
        point.insideIframeDropzone = hint?.insideDropzone
        ipc.emit("42_DRAGGER_OUTSIDE", point)
      }
    }

    hint?.update?.(x, y)
  }

  dragger.stop = async (x, y, e, target) => {
    if (ipc.inIframe) {
      isOutsideIframe = false
      dropEffect = await ipc.send("42_DRAGGER_STOP", { x, y })
    }

    cleanup()

    if (dropEffect === "move") hint?.destroy?.()
    else hint?.revert?.()

    hint = undefined
    data = undefined

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