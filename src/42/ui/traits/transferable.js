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
import HoverScroll from "../classes/HoverScroll.js"

const DEFAULTS = {
  selector: ":scope > *",
  hoverScroll: true,
  useSelection: true,
  handlerSelector: undefined,

  itemsHintConfig: {
    name: "stack",
    startAnimation: { ms: 180 },
    revertAnimation: { ms: 180 },
    dropAnimation: { ms: 180 },
  },

  dropzoneHintConfig: {
    name: "slide",
  },
}

const configure = settings("ui.trait.transferable", DEFAULTS)

/* ipc
====== */

import ipc from "../../core/ipc.js"
import sanitize from "../../fabric/dom/sanitize.js"
import clear from "../../fabric/type/object/clear.js"

const context = Object.create(null)

function serializeItems(obj, options) {
  const items = []

  for (const item of system.transfer.items) {
    const exportedItem = { ...item }
    exportedItem.ghost = exportedItem.ghost.outerHTML
    exportedItem.target = exportedItem.target.outerHTML
    if (options?.hideGhost) item.ghost.classList.add("hide")
    items.push(exportedItem)
  }

  const { dropzoneId } = system.transfer.items
  const { itemsHintConfig } = system.transfer
  return { ...obj, items, dropzoneId, itemsHintConfig }
}

function deserializeItems(items, parentX, parentY) {
  for (const item of items) {
    item.target = sanitize(item.target)
    item.ghost = sanitize(item.ghost)
    item.x += parentX
    item.y += parentY
  }
}

class IframeDropzoneHint {
  constructor(iframe) {
    this.iframe = iframe
    this.bus = ipc.to(iframe)
  }

  enter(items, x, y) {
    const { x: parentX, y: parentY } = this.iframe.getBoundingClientRect()
    this.bus.emit(
      "42_TRANSFER_ENTER",
      serializeItems({ x, y, parentX, parentY })
    )
  }

  leave() {
    this.bus.emit("42_TRANSFER_LEAVE")
  }

  dragover(items, x, y) {
    this.bus.emit("42_TRANSFER_DRAGOVER", { x, y })
  }

  async drop(items, x, y) {
    const res = await this.bus.send("42_TRANSFER_DROP", { x, y })

    if (res === "revert") {
      system.transfer.currentZone = undefined
      await system.transfer.unsetCurrentZone(x, y)
    } else if (res === "drop") {
      for (const item of system.transfer.items) {
        item.ghost.remove()
      }
    }

    return res
  }
}

if (inIframe) {
  ipc
    .on(
      "42_TRANSFER_ENTER",
      async ({
        x,
        y,
        items,
        itemsHintConfig,
        dropzoneId,
        parentX,
        parentY,
      }) => {
        context.parentX = parentX
        context.parentY = parentY

        x -= context.parentX
        y -= context.parentY
        deserializeItems(items, context.parentX * -1, context.parentY * -1)

        const { itemsHint } = await system.transfer.makeHints({
          itemsHintConfig,
        })

        system.transfer.items = itemsHint
        system.transfer.itemsHintConfig = itemsHintConfig
        system.transfer.items.dropzoneId = dropzoneId
        system.transfer.findTransferZones(x, y)

        system.transfer.items.start(x, y, items)
      }
    )
    .on("42_TRANSFER_DRAGOVER", async ({ x, y }) => {
      if (context.parentX && system.transfer.items) {
        x -= context.parentX
        y -= context.parentY
        system.transfer.setCurrentZone(x, y)
      }
    })
    .on("42_TRANSFER_LEAVE", async () => {
      clear(context)
    })
    .on("42_TRANSFER_DROP", async ({ x, y }) => {
      x -= context.parentX
      y -= context.parentY
      let res
      if (system.transfer.currentZone) {
        res = "drop"
        for (const item of system.transfer.items) {
          document.documentElement.append(item.ghost)
        }

        system.transfer.items.drag(x, y)
      } else {
        res = "revert"
      }

      system.transfer.unsetCurrentZone(x, y)
      clear(context)
      return res
    })
} else {
  ipc
    .on(
      "42_TRANSFER_START",
      async ({ x, y, items, dropzoneId, itemsHintConfig }, { iframe }) => {
        const iframeRect = iframe.getBoundingClientRect()
        const { borderTopWidth, borderLeftWidth } = getComputedStyle(iframe)
        context.parentX = iframeRect.x + Number.parseInt(borderLeftWidth, 10)
        context.parentY = iframeRect.y + Number.parseInt(borderTopWidth, 10)

        x += context.parentX
        y += context.parentY
        deserializeItems(items, context.parentX, context.parentY)

        const { itemsHint } = await system.transfer.makeHints({
          itemsHintConfig,
        })
        system.transfer.items = itemsHint
        system.transfer.itemsHintConfig = itemsHintConfig
        system.transfer.items.dropzoneId = dropzoneId
        system.transfer.findTransferZones(x, y)
        system.transfer.items.start(x, y, items)

        for (const item of system.transfer.items) {
          document.documentElement.append(item.ghost)
        }

        system.transfer.items.drag(x, y)
      }
    )
    .on("42_TRANSFER_DRAG", ({ x, y }) => {
      if (context.parentX && system.transfer.items) {
        x += context.parentX
        y += context.parentY
        system.transfer.setCurrentZone(x, y)
        system.transfer.items.drag?.(x, y)
      }
    })
    .on("42_TRANSFER_STOP", async ({ x, y }) => {
      if (context.parentX && system.transfer.items) {
        x += context.parentX
        y += context.parentY
        clear(context)
        const action = await system.transfer
          .unsetCurrentZone(x, y)
          .then((res) => {
            system.transfer.cleanup()
            return res
          })

        return { action }
      }
    })
}

/* system
========= */

system.transfer = {
  dropzones: new Map(),

  async makeHints({ itemsHintConfig, dropzoneHintConfig }, el) {
    const undones = []

    if (itemsHintConfig) {
      undones.push(
        import(`./transferable/${itemsHintConfig.name}ItemsHint.js`) //
          .then((m) => m.default(itemsHintConfig))
      )
    }

    if (dropzoneHintConfig) {
      undones.push(
        import(`./transferable/${dropzoneHintConfig.name}DropzoneHint.js`) //
          .then((m) => m.default(el, dropzoneHintConfig))
      )
    }

    const [itemsHint, dropzoneHint] = await Promise.all(undones)
    if (dropzoneHint) itemsHint.dropzoneId = dropzoneHint.el.id
    return { itemsHint, dropzoneHint }
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
            ? new IframeDropzoneHint(rect.target)
            : system.transfer.dropzones.get(rect.target)
        rect.hoverScroll = new HoverScroll(
          rect.target,
          rect.hint.config?.hoverScroll
        )
      }

      if (!inIframe) system.transfer.setCurrentZone(x, y)
    })
  },

  setCurrentZone(x, y) {
    const { zones, items } = system.transfer

    if (zones?.length > 0 === false) return
    const point = { x, y }

    if (system.transfer.currentZone) {
      if (inRect(point, system.transfer.currentZone)) {
        system.transfer.currentZone.hoverScroll.update({ x, y }, () => {
          system.transfer.currentZone?.hint.dragover(items, x, y)
        })
        return system.transfer.currentZone.hint.dragover(items, x, y)
      }

      system.transfer.currentZone.hoverScroll.clear()
      system.transfer.currentZone.hint.leave(items, x, y)
      system.transfer.currentZone = undefined
    }

    for (const dropzone of zones) {
      if (inRect(point, dropzone)) {
        system.transfer.currentZone = dropzone
        system.transfer.currentZone.hint.enter(items, x, y)
        system.transfer.currentZone.hoverScroll.update({ x, y }, () => {
          system.transfer.currentZone?.hint.dragover(items, x, y)
        })
        return system.transfer.currentZone.hint.dragover(items, x, y)
      }
    }
  },

  async unsetCurrentZone(x, y) {
    let res
    let finished
    const { items } = system.transfer

    if (system.transfer.currentZone) {
      res = await system.transfer.currentZone.hint.drop(items, x, y)
      res ??= "drop"
    } else {
      res = "revert"
      finished = system.transfer.items.revert?.(x, y)
      const { dropzoneId } = system.transfer.items
      const dropzoneTarget = document.querySelector(`#${dropzoneId}`)
      if (dropzoneTarget) {
        const dropzone = system.transfer.dropzones.get(dropzoneTarget)
        dropzone?.revert?.(items, finished)
      }

      await finished
    }

    return res
  },

  cleanup() {
    const dropzoneTarget =
      system.transfer.currentZone?.target ??
      (system.transfer.items.dropzoneId
        ? document.querySelector(`#${system.transfer.items.dropzoneId}`)
        : undefined)

    if (dropzoneTarget) {
      const selectable = dropzoneTarget[Trait.INSTANCES]?.selectable
      if (selectable) {
        selectable.clear()
        for (const item of system.transfer.items) {
          const target = document.querySelector(`#${item.target.id}`)
          if (target) selectable?.add(target)
        }
      }
    }

    system.transfer.items.length = 0
    system.transfer.items = undefined
    system.transfer.currentZone = undefined
  },
}

class Transferable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)
    this.config.selector = ensureScopeSelector(this.config.selector, this.el)

    if (typeof this.config.itemsHintConfig === "string") {
      this.config.itemsHintConfig = { name: this.config.itemsHintConfig }
    }

    if (typeof this.config.dropzoneHintConfig === "string") {
      this.config.dropzoneHintConfig = { name: this.config.dropzoneHintConfig }
    }

    this.config.dropzoneHintConfig.signal ??= this.cancel.signal
    this.config.dropzoneHintConfig.selector ??= this.config.selector
    this.config.dropzoneHintConfig.hoverScroll ??= this.config.hoverScroll

    this.init()
  }

  async init() {
    const { signal } = this.cancel

    const { itemsHintConfig, dropzoneHintConfig } = this.config

    const { itemsHint, dropzoneHint } = await system.transfer.makeHints(
      { itemsHintConfig, dropzoneHintConfig },
      this.el
    )

    if (dropzoneHint) {
      system.transfer.dropzones.set(this.el, dropzoneHint)
    }

    let startReady

    this.dragger = new Dragger(this.el, {
      signal,
      useTargetOffset: false,
      ...pick(this.config, ["selector", "hoverScroll", "useSelection"]),

      start: (x, y, e, target) => {
        if (
          this.config.handlerSelector &&
          !e.target.closest(this.config.handlerSelector)
        ) {
          return false
        }

        let targets

        system.transfer.items = itemsHint
        system.transfer.itemsHintConfig = itemsHintConfig

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

        startReady = Promise.all([
          system.transfer.findTransferZones(x, y),
          getRects(targets).then((rects) => {
            system.transfer.items.start?.(x, y, rects)
            if (inIframe) {
              ipc.emit(
                "42_TRANSFER_START",
                serializeItems({ x, y }, { hideGhost: true })
              )
            }
          }),
        ])
      },

      drag(x, y) {
        if (inIframe) {
          ipc.emit("42_TRANSFER_DRAG", { x, y })
        } else {
          system.transfer.setCurrentZone(x, y)
          system.transfer.items.drag?.(x, y)
        }
      },

      async stop(x, y) {
        await startReady

        if (inIframe) {
          const { action } = await ipc.send("42_TRANSFER_STOP", { x, y })

          if (action === "drop") {
            for (const item of system.transfer.items) {
              const target = document.querySelector(`#${item.target.id}`)
              target?.remove()
            }
          } else if (action === "revert") {
            for (const item of system.transfer.items) {
              const target = document.querySelector(`#${item.target.id}`)
              target?.classList.remove("hide")
            }
          }
        } else {
          await system.transfer.unsetCurrentZone(x, y)
        }

        system.transfer.cleanup()
      },
    })
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
