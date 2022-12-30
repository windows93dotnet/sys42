import system from "../../../system.js"
import inIframe from "../../../core/env/realm/inIframe.js"
import getRects from "../../../fabric/dom/getRects.js"
import { inRect } from "../../../fabric/geometry/point.js"
import IPCDropzoneHint from "./ipcDropzoneHint.js"

export async function makeHints(hints, el) {
  if (typeof hints.items === "string") {
    hints.items = { name: hints.items }
  }

  if (typeof hints.dropzone === "string") {
    hints.dropzone = { name: hints.dropzone }
  }

  const undones = []

  if (hints.items) {
    const itemsModuleName = inIframe ? "ipc" : hints.items.name
    undones.push(
      import(`./${itemsModuleName}ItemsHint.js`) //
        .then((m) => m.default(hints.items))
    )
  }

  if (hints.dropzone) {
    const dropzoneModuleName = hints.dropzone.name
    undones.push(
      import(`./${dropzoneModuleName}DropzoneHint.js`) //
        .then((m) => m.default(el, hints.dropzone))
    )
  }

  const [items, dropzone] = await Promise.all(undones)

  items.list ??= []

  return { items, dropzone }
}

//

export function findTransferZones() {
  getRects([
    ...system.transfer.dropzones.keys(),
    ...document.querySelectorAll("iframe"),
  ]).then((rects) => {
    system.transfer.zones = rects
    for (const rect of rects) {
      rect.hint =
        rect.target.localName === "iframe"
          ? new IPCDropzoneHint(rect.target)
          : system.transfer.dropzones.get(rect.target)
    }
  })
}

//

export function setCurrentZone(x, y) {
  const { zones } = system.transfer

  if (!zones) return
  const point = { x, y }

  if (system.transfer.currentZone) {
    if (inRect(point, system.transfer.currentZone)) {
      system.transfer.currentZone.hint.dragover()
      return
    }

    system.transfer.currentZone.hint.leave()
    system.transfer.currentZone = undefined
  }

  for (const dropzone of zones) {
    if (inRect(point, dropzone)) {
      system.transfer.currentZone = dropzone
      system.transfer.currentZone.hint.enter()
      system.transfer.currentZone.hint.dragover()
      break
    }
  }
}
