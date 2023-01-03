import system from "../../system.js"
import Trait from "../classes/Trait.js"
import Dragger from "../classes/Dragger.js"
import inIframe from "../../core/env/realm/inIframe.js"
import getRects from "../../fabric/dom/getRects.js"
import { inRect } from "../../fabric/geometry/point.js"
import pick from "../../fabric/type/object/pick.js"
import settings from "../../core/settings.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import removeItem from "../../fabric/type/array/removeItem.js"

import ipc from "../../core/ipc.js"
import sanitize from "../../fabric/dom/sanitize.js"
import clear from "../../fabric/type/object/clear.js"

const context = Object.create(null)

export class IPCDropzoneHint {
  constructor(options) {
    this.config = { ...options }
  }

  enter() {
    // console.log("ipc enter")
  }

  leave() {
    // console.log("ipc leave")
  }

  dragover() {
    // console.log("ipc dragover")
  }

  drop() {
    console.log("ipc drop")
  }
}

ipc
  .on("42_TRANSFER_START", async ({ x, y, items, config }, { iframe }) => {
    context.iframeRect = iframe.getBoundingClientRect()
    const { borderTopWidth, borderLeftWidth } = getComputedStyle(iframe)
    context.iframeRect.x += Number.parseInt(borderLeftWidth, 10)
    context.iframeRect.y += Number.parseInt(borderTopWidth, 10)

    x += context.iframeRect.x
    y += context.iframeRect.y

    context.hints = await system.transfer.makeHints({ items: config })
    system.transfer.items = context.hints.items
    system.transfer.items.push(...items)

    system.transfer.findTransferZones(x, y)

    for (const item of items) {
      item.target = sanitize(item.target)
      item.ghost = sanitize(item.ghost)
      item.x += context.iframeRect.x
      item.y += context.iframeRect.y
    }

    system.transfer.items.start(x, y, items)
    system.transfer.items.drag(x, y)
  })
  .on("42_TRANSFER_DRAG", ({ x, y }) => {
    if (context.iframeRect) {
      x += context.iframeRect.x
      y += context.iframeRect.y
      system.transfer.setCurrentZone(x, y)
      system.transfer.items.drag?.(x, y)
    }
  })
  .on("42_TRANSFER_STOP", ({ x, y }) => {
    if (context.iframeRect) {
      x += context.iframeRect.x
      y += context.iframeRect.y
      system.transfer.unsetCurrentZone(x, y)
      clear(context)
    }
  })

const DEFAULTS = {
  selector: ":scope > *",
  autoScroll: true,
  useSelection: true,
  handlerSelector: undefined,
  hints: {
    items: {
      name: "stack",
      startAnimation: { ms: 180 },
      revertAnimation: { ms: 180 },
      dropAnimation: { ms: 180 },
    },
    dropzone: {
      name: "slide",
    },
  },
}

const configure = settings("ui.trait.transferable", DEFAULTS)

system.transfer = {
  dropzones: new Map(),

  async makeHints(hints, el) {
    if (typeof hints.items === "string") {
      hints.items = { name: hints.items }
    }

    if (typeof hints.dropzone === "string") {
      hints.dropzone = { name: hints.dropzone }
    }

    const undones = []

    if (hints.items) {
      const itemsModuleName = hints.items.name
      undones.push(
        import(`./transferable/${itemsModuleName}ItemsHint.js`) //
          .then((m) => m.default(hints.items))
      )
    }

    if (hints.dropzone) {
      const dropzoneModuleName = hints.dropzone.name
      undones.push(
        import(`./transferable/${dropzoneModuleName}DropzoneHint.js`) //
          .then((m) => m.default(el, hints.dropzone))
      )
    }

    const [items, dropzone] = await Promise.all(undones)
    return { items, dropzone }
  },

  async findTransferZones(x, y) {
    return getRects([
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

      system.transfer.setCurrentZone(x, y)
    })
  },

  setCurrentZone(x, y) {
    const { zones, items } = system.transfer

    if (zones?.length > 0 === false) return
    const point = { x, y }

    if (system.transfer.currentZone) {
      if (inRect(point, system.transfer.currentZone)) {
        return system.transfer.currentZone.hint.dragover(items, x, y)
      }

      system.transfer.currentZone.hint.leave()
      system.transfer.currentZone = undefined
    }

    for (const dropzone of zones) {
      if (inRect(point, dropzone)) {
        system.transfer.currentZone = dropzone
        system.transfer.currentZone.hint.enter()
        return system.transfer.currentZone.hint.dragover(items, x, y)
      }
    }
  },

  unsetCurrentZone(x, y) {
    if (system.transfer.currentZone) {
      const { items } = system.transfer
      system.transfer.currentZone.hint.drop(items, x, y)
      system.transfer.currentZone = undefined
    } else {
      system.transfer.items.revert?.(x, y)
    }
  },
}

class Transferable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)
    this.config.selector = ensureScopeSelector(this.config.selector, this.el)

    this.init()
  }

  async init() {
    const { signal } = this.cancel

    this.hints = await system.transfer.makeHints(this.config.hints, this.el)

    if (this.hints.dropzone) {
      system.transfer.dropzones.set(this.el, this.hints.dropzone)
    }

    let startReady

    this.dragger = new Dragger(this.el, {
      signal,
      useTargetOffset: false,
      ...pick(this.config, ["selector", "autoScroll", "useSelection"]),

      start: (x, y, e, target) => {
        if (
          this.config.handlerSelector &&
          !e.target.closest(this.config.handlerSelector)
        ) {
          return false
        }

        let targets

        if (this.config.useSelection) {
          const selectable = this.el[Trait.INSTANCES]?.selectable
          if (selectable) {
            selectable.ensureSelected(target)
            const { elements } = selectable
            targets = [...elements]
            removeItem(targets, target)
            targets.unshift(target)
            selectable.clear()
          } else targets = [target]
        } else targets = [target]

        system.transfer.items = this.hints.items

        startReady = Promise.all([
          system.transfer.findTransferZones(x, y),
          getRects(targets).then((rects) => {
            system.transfer.items.start?.(x, y, rects)
            if (inIframe) {
              const items = []
              const config = this.config.hints.items

              for (const item of system.transfer.items) {
                const exportedItem = { ...item }
                exportedItem.ghost = exportedItem.ghost.outerHTML
                exportedItem.target = exportedItem.target.outerHTML
                item.ghost.classList.add("hide")
                items.push(exportedItem)
              }

              ipc.emit("42_TRANSFER_START", { x, y, items, config })
            }
          }),
        ])
      },

      drag(x, y) {
        system.transfer.setCurrentZone(x, y)
        system.transfer.items.drag?.(x, y)
        if (inIframe) {
          ipc.emit("42_TRANSFER_DRAG", { x, y })
        }
      },

      stop: async (x, y) => {
        if (inIframe) {
          ipc.emit("42_TRANSFER_STOP", { x, y })
          return
        }

        await startReady
        const dropzone = system.transfer.currentZone?.target ?? this.el
        system.transfer.unsetCurrentZone(x, y)

        const selectable = dropzone[Trait.INSTANCES]?.selectable
        if (selectable) {
          selectable.clear()
          for (const item of system.transfer.items) {
            selectable?.add(item.target)
          }
        }

        system.transfer.items.length = 0
      },
    })
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
