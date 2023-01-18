import system from "../../system.js"
import Trait from "../classes/Trait.js"
import Dragger from "../classes/Dragger.js"
import inIframe from "../../core/env/realm/inIframe.js"
import getRects from "../../fabric/dom/getRects.js"
import { inRect } from "../../fabric/geometry/point.js"
import pick from "../../fabric/type/object/pick.js"
import unproxy from "../../fabric/type/object/unproxy.js"
import settings from "../../core/settings.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import HoverScroll from "../classes/HoverScroll.js"
import setCursor from "../../fabric/dom/setCursor.js"
import keyboard from "../../core/devices/keyboard.js"
import listen from "../../fabric/event/listen.js"

const DEFAULTS = {
  selector: ":scope > *",
  useSelection: true,
  handlerSelector: undefined,

  itemsConfig: {
    name: "stack",
    startAnimation: { ms: 180 },
    revertAnimation: { ms: 180 },
    dropAnimation: { ms: 180 },
  },

  dropzoneConfig: {
    name: "slide",
    speed: 180,
  },
}

const configure = settings("ui.trait.transferable", DEFAULTS)

/* ipc
====== */

import ipc from "../../core/ipc.js"
import sanitize from "../../fabric/dom/sanitize.js"
import clear from "../../fabric/type/object/clear.js"

const iframeDropzones = []
const context = Object.create(null)

function serializeItems(obj, options) {
  const items = []

  for (const item of system.transfer.items) {
    const exportedItem = { ...item }
    exportedItem.ghost = exportedItem.ghost.outerHTML
    exportedItem.target = exportedItem.target.outerHTML
    if (exportedItem.data) exportedItem.data = unproxy(exportedItem.data)
    if (options?.hideGhost) item.ghost.classList.add("hide")
    items.push(exportedItem)
  }

  const { dropzoneId } = system.transfer.items
  const { itemsConfig } = system.transfer
  return { ...obj, items, dropzoneId, itemsConfig }
}

function deserializeItems(items, parentX, parentY) {
  for (const item of items) {
    item.target = sanitize(item.target)
    item.ghost = sanitize(item.ghost)
    item.x += parentX
    item.y += parentY
  }
}

function cleanHints() {
  if (system.transfer.items) system.transfer.items.length = 0
  system.transfer.items = undefined
  system.transfer.currentZone = undefined
  removeEffect()
}

class IframeDropzoneHint {
  constructor(iframe) {
    this.el = iframe
    this.bus = ipc.to(iframe)
    iframeDropzones.push(this)
  }

  enter(items, x, y) {
    const { x: parentX, y: parentY } = this.el.getBoundingClientRect()
    this.bus.emit("42_TF_v_ENTER", serializeItems({ x, y, parentX, parentY }))
  }

  leave() {}

  dragover(items, x, y) {
    this.bus.emit("42_TF_v_DRAGOVER", { x, y })
  }

  async drop(items, x, y) {
    const res = await this.bus.send("42_TF_v_DROP", { x, y })

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

  async destroy() {
    await this.bus.send("42_TF_v_CLEANUP")
    // TODO: debug ipc Sender.destroy
    // this.bus.destroy()
  }
}

if (inIframe) {
  ipc
    .on(
      "42_TF_v_ENTER",
      async ({ x, y, items, itemsConfig, dropzoneId, parentX, parentY }) => {
        context.parentX = parentX
        context.parentY = parentY

        x -= context.parentX
        y -= context.parentY
        deserializeItems(items, context.parentX * -1, context.parentY * -1)

        const { itemsHint } = await system.transfer.makeHints({
          itemsConfig,
        })

        context.ready = true

        system.transfer.items = itemsHint
        system.transfer.itemsConfig = itemsConfig
        system.transfer.items.dropzoneId = dropzoneId
        system.transfer.findTransferZones(x, y)

        system.transfer.items.start(x, y, items)
      }
    )
    .on("42_TF_v_DRAGOVER", async ({ x, y }) => {
      if (!context.ready) return
      x -= context.parentX
      y -= context.parentY
      system.transfer.setCurrentZone(x, y)
    })
    .on("42_TF_v_DROP", async ({ x, y }) => {
      if (!context.ready) return

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

      system.transfer
        .unsetCurrentZone(x, y)
        .then(() => system.transfer.handleSelection())

      clear(context)
      return res
    })
    .on("42_TF_v_EFFECT", (effect) => {
      applyEffect(effect)
    })
    .on("42_TF_v_REQUEST_EFFECT", async (keys) => {
      context.keys = keys
      await setEffect({ bypassIframeIgnore: true })
      delete context.keys
      return system.transfer.effect
    })
    .on("42_TF_v_CLEANUP", async () => {
      cleanHints()
    })
} else {
  ipc
    .on("42_TF_^_REQUEST_EFFECT", (keys) => {
      context.keys = keys
      setEffect()
    })
    .on(
      "42_TF_^_START",
      async ({ x, y, items, dropzoneId, itemsConfig }, { iframe }) => {
        context.fromIframe = true

        const iframeRect = iframe.getBoundingClientRect()
        const { borderTopWidth, borderLeftWidth } = getComputedStyle(iframe)
        context.parentX = iframeRect.x + Number.parseInt(borderLeftWidth, 10)
        context.parentY = iframeRect.y + Number.parseInt(borderTopWidth, 10)

        x += context.parentX
        y += context.parentY
        deserializeItems(items, context.parentX, context.parentY)
        cleanHints()

        const { itemsHint } = await system.transfer.makeHints({
          itemsConfig,
        })
        system.transfer.items = itemsHint
        system.transfer.itemsConfig = itemsConfig
        system.transfer.items.dropzoneId = dropzoneId
        const zoneReady = system.transfer.findTransferZones(x, y)
        system.transfer.items.start(x, y, items)

        for (const item of system.transfer.items) {
          document.documentElement.append(item.ghost)
        }

        system.transfer.items.drag(x, y)

        zoneReady.then(() => {
          for (const iframeDz of iframeDropzones) {
            if (iframeDz.el === iframe) {
              context.originIframeDropzone = iframeDz
              break
            }
          }
        })
      }
    )
    .on("42_TF_^_DRAG", ({ x, y }) => {
      if (context.parentX && system.transfer.items) {
        x += context.parentX
        y += context.parentY
        system.transfer.setCurrentZone(x, y)
        system.transfer.items.drag?.(x, y)
      }
    })
    .on("42_TF_^_STOP", ({ x, y }) => {
      if (context.parentX && system.transfer.items) {
        x += context.parentX
        y += context.parentY
        clear(context)
        system.transfer
          .unsetCurrentZone(x, y)
          .then(() => system.transfer.handleSelection())
      }
    })
}

/* effect
========= */

const keyToEffect = [
  ["Control", "copy"],
  ["Shift", "link"],
]

const effectToCursor = {
  none: "no-drop",
  move: "grabbing",
  copy: "copy",
  link: "alias",
}

function applyEffect(name) {
  system.transfer.effect = name

  if (context.fromIframe) {
    context.originIframeDropzone?.bus.emit("42_TF_v_EFFECT", name)
  }

  setCursor(effectToCursor[name])
}

async function setEffect(options) {
  if (inIframe && options?.bypassIframeIgnore !== true) return

  if (system.transfer.currentZone) {
    const keys = context.keys ?? keyboard.keys
    if (system.transfer.currentZone.isIframe) {
      const effect = await system.transfer.currentZone.hint.bus.send(
        "42_TF_v_REQUEST_EFFECT",
        keys
      )
      applyEffect(effect)
    } else {
      for (const [key, effect] of keyToEffect) {
        if (key in keys) return applyEffect(effect)
      }

      applyEffect("move")
    }
  } else {
    applyEffect("none")
  }
}

function removeEffect() {
  system.transfer.effect = undefined
  setCursor()
}

/* system
========= */

system.transfer = {
  dropzones: new Map(),

  effect: undefined,

  async makeHints({ itemsConfig, dropzoneConfig }, el) {
    const undones = []

    if (itemsConfig) {
      undones.push(
        import(`./transferable/${itemsConfig.name}ItemsHint.js`) //
          .then((m) => m.default(itemsConfig))
      )
    }

    if (dropzoneConfig) {
      undones.push(
        import(`./transferable/${dropzoneConfig.name}DropzoneHint.js`) //
          .then((m) => m.default(el, dropzoneConfig))
      )
    }

    const [itemsHint, dropzoneHint] = await Promise.all(undones)
    if (dropzoneHint) itemsHint.dropzoneId = dropzoneHint.el.id
    return { itemsHint, dropzoneHint }
  },

  async findTransferZones() {
    return getRects([
      ...system.transfer.dropzones.keys(),
      ...document.querySelectorAll("iframe"),
    ]).then((rects) => {
      system.transfer.zones = rects
      for (const rect of rects) {
        if (rect.target.localName === "iframe") {
          rect.hint = new IframeDropzoneHint(rect.target)
          rect.isIframe = true
        } else {
          rect.hint = system.transfer.dropzones.get(rect.target)
          rect.hoverScroll = new HoverScroll(
            rect.target,
            rect.hint.config?.hoverScroll
          )
        }

        rect.hint.mount()
      }
    })
  },

  setCurrentZone(x, y) {
    setEffect()
    const { zones, items } = system.transfer

    if (zones?.length > 0 === false) return
    const point = { x, y }

    if (system.transfer.currentZone) {
      if (inRect(point, system.transfer.currentZone)) {
        system.transfer.currentZone.hoverScroll?.update({ x, y }, async () => {
          await system.transfer.currentZone?.hint.updateRects()
          system.transfer.currentZone?.hint.dragover(items, x, y)
        })
        return system.transfer.currentZone.hint.dragover(items, x, y)
      }

      system.transfer.currentZone.hoverScroll?.clear()
      system.transfer.currentZone.hint.leave(items, x, y)
      system.transfer.currentZone = undefined
    }

    for (const dropzone of zones) {
      if (inRect(point, dropzone)) {
        system.transfer.currentZone = dropzone
        system.transfer.currentZone.hint.enter(items, x, y)
        system.transfer.currentZone.hoverScroll?.update({ x, y }, async () => {
          await system.transfer.currentZone?.hint.updateRects()
          system.transfer.currentZone?.hint.dragover(items, x, y)
        })
        return system.transfer.currentZone.hint.dragover(items, x, y)
      }
    }
  },

  async unsetCurrentZone(x, y) {
    let res
    let finished
    const { items, zones } = system.transfer

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
        dropzone?.revert?.(items)
      }

      await finished
    }

    for (const dropzone of zones) {
      dropzone.hint.unmount(items)
      dropzone.hoverScroll?.clear()
    }

    return res
  },

  handleSelection() {
    if (!system.transfer.items) {
      cleanHints()
      return
    }

    const dropzoneTarget =
      system.transfer.currentZone?.target ??
      (system.transfer.items?.dropzoneId
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

    cleanHints()
  },
}

class Transferable extends Trait {
  constructor(el, options) {
    super(el, options)

    if (options?.list) {
      this.list = options?.list
      delete options.list
    }

    this.config = configure(options)
    this.config.selector = ensureScopeSelector(this.config.selector, this.el)

    if (typeof this.config.itemsConfig === "string") {
      this.config.itemsConfig = { name: this.config.itemsConfig }
    }

    if (typeof this.config.dropzoneConfig === "string") {
      this.config.dropzoneConfig = { name: this.config.dropzoneConfig }
    }

    this.config.dropzoneConfig.signal ??= this.cancel.signal
    this.config.dropzoneConfig.selector ??= this.config.selector
    this.config.dropzoneConfig.indexChange ??= this.config.indexChange
    this.config.dropzoneConfig.list = this.list

    this.init()
  }

  async init() {
    const { signal } = this.cancel

    const { itemsConfig, dropzoneConfig } = this.config

    const { itemsHint, dropzoneHint } = await system.transfer.makeHints(
      { itemsConfig, dropzoneConfig },
      this.el
    )

    if (dropzoneHint) {
      system.transfer.dropzones.set(this.el, dropzoneHint)
    }

    let startPromise
    let startReady
    let forgetKeyevents

    this.dragger = new Dragger(this.el, {
      signal,
      useTargetOffset: false,
      ...pick(this.config, ["selector", "useSelection"]),

      start: (x, y, e, target) => {
        if (
          this.config.handlerSelector &&
          !e.target.closest(this.config.handlerSelector)
        ) {
          return false
        }

        let targets
        startReady = false

        forgetKeyevents = listen({
          async "keydown || keyup"() {
            if (inIframe) ipc.emit("42_TF_^_REQUEST_EFFECT", keyboard.keys)
            else setEffect()
          },
        })

        cleanHints()
        system.transfer.items = itemsHint
        system.transfer.itemsConfig = itemsConfig

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

        startPromise = Promise.all([
          system.transfer.findTransferZones(x, y),
          getRects(targets, {
            all: this.config.selector,
            includeMargins: true,
          }).then((rects) => {
            if (this.list) {
              for (const item of rects) item.data = this.list[item.index]
            }

            system.transfer.items.start?.(x, y, rects)
            if (inIframe) {
              ipc.emit(
                "42_TF_^_START",
                serializeItems({ x, y }, { hideGhost: true })
              )
            }
          }),
        ]).then(() => {
          startReady = true
          system.transfer.setCurrentZone(x, y)
          system.transfer.items.drag?.(x, y)
        })
      },

      drag(x, y) {
        if (!startReady) return
        if (inIframe) {
          ipc.emit("42_TF_^_DRAG", { x, y })
        } else {
          system.transfer.setCurrentZone(x, y)
          system.transfer.items.drag?.(x, y)
        }
      },

      async stop(x, y) {
        startReady = false
        removeEffect()
        forgetKeyevents()
        await startPromise

        if (inIframe) {
          ipc.emit("42_TF_^_STOP", { x, y })
          for (const item of system.transfer.items) {
            const target = document.querySelector(`#${item.target.id}`)
            item.target = target
          }
        }

        await system.transfer.unsetCurrentZone(x, y)
        system.transfer.handleSelection()

        for (const iframeDz of iframeDropzones) iframeDz.destroy()
        iframeDropzones.length = 0
      },
    })
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
