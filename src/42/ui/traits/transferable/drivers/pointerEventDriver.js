import listen from "../../../../fabric/event/listen.js"
import Dragger from "../../../classes/Dragger.js"
import { getIndex, getNewIndex } from "../getIndex.js"
import SlideHint from "../hints/SlideHint.js"
import FloatHint from "../hints/FloatHint.js"
import { inRect } from "../../../../fabric/geometry/point.js"
import unproxy from "../../../../fabric/type/object/unproxy.js"
import sanitize from "../../../../fabric/dom/sanitize.js"
import ipc from "../../../../core/ipc.js"

let data
let hint
let previousHint
let iframeRect
let outsideIframe
let currentDropzone
let isDragging = false
let dropEffect = "none"

function cleanup() {
  for (const item of document.querySelectorAll(".dragover")) {
    item.classList.remove("dragover")
  }

  if (previousHint) {
    previousHint.destroy()
    previousHint = undefined
  }

  data = undefined
  hint = undefined
  iframeRect = undefined
  outsideIframe = undefined
  currentDropzone = undefined
  isDragging = false
  dropEffect = "none"
}

function makeHint(type, options) {
  return type === "float" //
    ? new FloatHint(options)
    : new SlideHint(options)
}

const dropzones = new Set()

if (ipc.inTop) {
  ipc.on("42_DRAGGER_START", (res, meta) => {
    if (iframeRect) return
    isDragging = true

    iframeRect = meta.iframe.getBoundingClientRect()
    data = res.data

    if (res?.previous) {
      const { previous } = res
      previous.ghost = sanitize(previous.ghostHTML)
      hint = makeHint("slide", { previous })
      hint.keepGhost = false
      hint.id = previous.id

      hint.ghost.style.opacity = 0
      document.documentElement.append(hint.ghost)
    }
  })

  ipc.on("42_DRAGGER_OUTSIDE", (point) => {
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
      hint.move(point.x, point.y)
    }

    const target = document.elementFromPoint(point.x, point.y)

    if (currentDropzone) {
      if (currentDropzone.dropzone.contains(target)) {
        hint?.dragoverDropzone?.(point.x, point.y)
      } else {
        currentDropzone.events.pointerleave()
        currentDropzone = undefined
      }
    } else {
      for (const { dropzone, events } of dropzones) {
        if (dropzone.contains(target)) {
          currentDropzone = { dropzone, events }
          outsideIframe = false
          events.pointerenter(point)
          outsideIframe = true
          hint?.dragoverDropzone?.(point.x, point.y)
          break
        }
      }
    }
  })

  ipc.on("42_DRAGGER_INSIDE", () => {
    outsideIframe = false
    hint.ghost.style.opacity = 0
  })

  ipc.on("42_DRAGGER_STOP", ({ x, y }) => {
    if (outsideIframe) {
      x += iframeRect.left
      y += iframeRect.top
      const target = document.elementFromPoint(x, y)
      for (const { dropzone, events } of dropzones) {
        if (dropzone.contains(target)) {
          events.pointerup({ target, x, y })
        } else hint?.destroy()
      }
    } else {
      hint?.destroy()
    }

    isDragging = false

    const res = dropEffect
    cleanup()
    return res
  })
}

export function pointerEventDriver(trait) {
  const { /* effects, */ dropzone } = trait
  const { id } = dropzone

  const hintType = trait.config.hint.type

  const { signal } = trait.cancel

  /* dropzone
  =========== */

  const events = {
    signal,

    pointermove({ x, y }) {
      if (isDragging) {
        hint?.dragoverDropzone?.(x, y)
      }
    },

    pointerenter({ x, y }) {
      if (outsideIframe) return

      if (isDragging) {
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
            previousHint = hint
            hint = makeHint(hintType, { trait, previous: previousHint })
            hint.move(x, y)
          }
        }
      }
    },

    pointerleave() {
      if (isDragging) {
        dropzone.classList.remove("dragover")
        dropEffect = "none"

        if (previousHint) {
          hint.destroy()
          hint = previousHint
          previousHint = undefined
        }

        hint?.leaveDropzone?.()
      }
    },

    pointerup(e) {
      if (isDragging) {
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
  const instance = { dropzone, events }
  dropzones.add(instance)
  signal.addEventListener("abort", () => dropzones.delete(instance))

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
    isDragging = true
    dropEffect = "none"
    trait.isSorting = false
    const index = getIndex(target)
    data = trait.export({ index, target })

    hint = makeHint(hintType, { trait, x, y, target, index })

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

      let previous
      if (hint) {
        previous = hint.clone()
        previous.ghostHTML = hint.ghost.outerHTML
        previous.id = id
        delete previous.ghost
      }

      ipc.emit("42_DRAGGER_START", { previous, data: unproxy(data) })
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

    hint?.move?.(x, y)
  }

  dragger.stop = async (x, y, e, target) => {
    isDragging = false
    if (ipc.inIframe) {
      isOutsideIframe = false
      dropEffect = await ipc.send("42_DRAGGER_STOP", { x, y })
    }

    if (dropEffect === "move") hint?.destroy?.()
    else hint?.revert?.()

    if (trait.isSorting) {
      trait.isSorting = false
    } else if (dropEffect === "move") {
      const index = getIndex(target)
      trait.removeItem(index)
    }

    cleanup()
  }
}

export default pointerEventDriver
