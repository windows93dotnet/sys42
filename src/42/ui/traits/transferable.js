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
  distance: 0,
  useSelection: true,
  handlerSelector: undefined,

  itemsConfig: "stack",
  dropzoneConfig: "stack",

  animationSpeed: 180,
}

const configure = settings("ui.trait.transferable", DEFAULTS)

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

function applyEffect(name, options) {
  // console.log(inIframe ? "🪟" : "🌐", Date.now(), name, options?.bypassEmit)
  system.transfer.effect = name

  if (options?.bypassEmit !== true) {
    if (context.fromIframe) {
      context.originIframeDropzone?.bus.emit("42_TF_v_EFFECT", name)
    } else if (inIframe) {
      ipc.emit("42_TF_^_EFFECT", name)
    }
  }

  setCursor(effectToCursor[name])
}

async function setEffect(options) {
  if (system.transfer.currentZone) {
    const keys = context.keys ?? keyboard.keys
    if (system.transfer.currentZone.hint.isIframe) {
      const effect = await system.transfer.currentZone.hint.bus.send(
        "42_TF_v_REQUEST_EFFECT",
        keys
      )
      applyEffect(effect ?? "none", options)
    } else {
      for (const [key, effect] of keyToEffect) {
        if (key in keys) return applyEffect(effect, options)
      }

      applyEffect("move", options)
    }
  } else {
    applyEffect("none", options)
  }
}

/* system
========= */

system.transfer = {
  dropzones: new Map(),
  items: undefined,
  currentZone: undefined,
  effect: undefined,
}

async function makeHints({ itemsConfig, dropzoneConfig }, el) {
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
}

async function activateZones(x, y) {
  return getRects([
    ...system.transfer.dropzones.keys(),
    ...document.querySelectorAll("iframe"),
  ]).then((rects) => {
    system.transfer.zones = rects
    for (const rect of rects) {
      if (rect.target.localName === "iframe") {
        rect.hint = new IframeDropzoneHint(rect.target)
      } else {
        rect.hint = system.transfer.dropzones.get(rect.target)
        rect.hoverScroll = new HoverScroll(
          rect.target,
          rect.hint.config?.hoverScroll
        )
      }

      rect.hint.activate(x, y)
    }
  })
}

async function haltZones(x, y) {
  const { zones } = system.transfer

  if (system.transfer.currentZone) {
    await system.transfer.currentZone.hint.drop(x, y)
  }

  if (system.transfer.effect === "move") {
    await system.transfer.items.adopt(x, y)
  } else if (system.transfer.effect === "none") {
    await system.transfer.items.revert()
  } else if (
    system.transfer.effect === "copy" ||
    system.transfer.effect === "link"
  ) {
    await system.transfer.items.fork(x, y)
  } else {
    const type = typeof system.transfer.effect
    throw new Error(
      `Unknown system.transfer.effect : ${
        type === "string" ? system.transfer.effect : type
      }`
    )
  }

  for (const dropzone of zones) {
    dropzone.hint.halt()
    dropzone.hoverScroll?.clear()
  }

  cleanHints()
}

function setCurrentZone(x, y) {
  const { zones } = system.transfer

  const point = { x, y }

  if (system.transfer.currentZone) {
    if (inRect(point, system.transfer.currentZone)) {
      system.transfer.currentZone.hoverScroll?.update({ x, y }, async () => {
        await system.transfer.currentZone?.hint.scan()
        system.transfer.currentZone?.hint.dragover(x, y)
      })
      system.transfer.currentZone.hint.dragover(x, y)
      return
    }

    system.transfer.currentZone.hoverScroll?.clear()
    system.transfer.currentZone.hint.leave(x, y)
    system.transfer.currentZone = undefined
    setEffect()
  }

  for (const dropzone of zones) {
    if (inRect(point, dropzone)) {
      system.transfer.currentZone = dropzone
      setEffect()
      system.transfer.currentZone.hint.enter(x, y)
      system.transfer.currentZone.hoverScroll?.update({ x, y }, async () => {
        await system.transfer.currentZone?.hint.scan()
        system.transfer.currentZone?.hint.dragover(x, y)
      })
      system.transfer.currentZone.hint.dragover(x, y)
      return
    }
  }

  setEffect()
}

/* ipc
====== */

import ipc from "../../core/ipc.js"
import sanitize from "../../fabric/dom/sanitize.js"
import clear from "../../fabric/type/object/clear.js"

const iframeDropzones = []
const context = Object.create(null)

function serializeItems({ hideGhost, x = 0, y = 0 }) {
  const items = []

  const { originDropzone } = system.transfer.items

  for (const item of system.transfer.items) {
    const exportedItem = { ...item }
    exportedItem.x -= x
    exportedItem.y -= y
    exportedItem.target = exportedItem.target.cloneNode(true)
    originDropzone?.reviveTarget(exportedItem.target)
    exportedItem.target = exportedItem.target.outerHTML
    exportedItem.ghost = exportedItem.ghost.outerHTML
    if (exportedItem.data) exportedItem.data = unproxy(exportedItem.data)
    if (hideGhost) item.ghost.classList.add("hide")
    items.push(exportedItem)
  }

  const { dropzoneId } = system.transfer.items
  const { itemsConfig } = system.transfer

  return { items, dropzoneId, itemsConfig }
}

function deserializeItems(items, parentX = 0, parentY = 0) {
  for (const item of items) {
    item.target =
      (context.isOriginIframe
        ? document.querySelector(`#${item.id}`)
        : undefined) ?? sanitize(item.target)
    item.ghost = sanitize(item.ghost)
    item.x += parentX
    item.y += parentY
  }
}

function cleanHints() {
  if (system.transfer.items) system.transfer.items.length = 0
  system.transfer.items = undefined
  system.transfer.currentZone = undefined
  system.transfer.effect = undefined
  setCursor()
}

function getIframeInnerCoord(iframe) {
  const iframeRect = iframe.getBoundingClientRect()
  const { borderTopWidth, borderLeftWidth } = getComputedStyle(iframe)
  return {
    x: iframeRect.x + Number.parseInt(borderLeftWidth, 10),
    y: iframeRect.y + Number.parseInt(borderTopWidth, 10),
  }
}

class IframeDropzoneHint {
  constructor(iframe) {
    this.el = iframe
    this.bus = ipc.to(iframe, { ignoreUnresponsive: true })
    this.isIframe = true
    iframeDropzones.push(this)
  }

  #substractCoord(x, y) {
    return { x: x - this.x, y: y - this.y }
  }

  scan() {}

  activate() {
    const { x, y } = getIframeInnerCoord(this.el)
    this.x = x
    this.y = y
  }

  halt() {
    this.bus.emit("42_TF_v_CLEANUP")
  }

  leave(x, y) {
    this.bus.emit("42_TF_v_LEAVE", this.#substractCoord(x, y))
  }

  async enter(x, y) {
    await this.bus.ready
    this.bus.emit("42_TF_v_ENTER", {
      ...this.#substractCoord(x, y),
      ...serializeItems(this),
    })
  }

  dragover(x, y) {
    this.bus.emit("42_TF_v_DRAGOVER", this.#substractCoord(x, y))
  }

  async drop(x, y) {
    if (system.transfer.effect !== "none") system.transfer.items.removeGhosts()
    if (system.transfer.effect === "move") system.transfer.items.hideTargets()
    await this.bus.send("42_TF_v_DROP", this.#substractCoord(x, y))
  }

  async destroy() {
    // TODO: debug ipc Sender.destroy
    // this.bus.destroy()
  }
}

if (inIframe) {
  let enterReady = false
  ipc
    .on("42_TF_v_ENTER", async ({ x, y, items, itemsConfig, dropzoneId }) => {
      enterReady = false
      deserializeItems(items)

      const { itemsHint } = await makeHints({ itemsConfig })

      system.transfer.items = itemsHint
      system.transfer.itemsConfig = itemsConfig
      system.transfer.items.dropzoneId = dropzoneId
      system.transfer.items.start(x, y, items)

      await activateZones(x, y)
      setCurrentZone(x, y)
      enterReady = true
    })
    .on("42_TF_v_LEAVE", ({ x, y }) => {
      if (system.transfer.currentZone) {
        system.transfer.currentZone.hoverScroll?.clear()
        system.transfer.currentZone.hint.leave(x, y)
        system.transfer.currentZone = undefined
      }
    })
    .on("42_TF_v_DRAGOVER", ({ x, y }) => {
      if (enterReady) setCurrentZone(x, y)
    })
    .on("42_TF_v_DROP", async ({ x, y }) => {
      if (system.transfer.effect === "none") haltZones(x, y)
      else await haltZones(x, y)
    })
    .on("42_TF_v_REVERT", async ({ x, y }) => {
      haltZones(x, y)
    })
    .on("42_TF_v_EFFECT", (effect) => {
      applyEffect(effect, { bypassEmit: true })
    })
    .on("42_TF_v_REQUEST_EFFECT", async (keys) => {
      context.keys = keys
      await setEffect({ bypassEmit: true })
      context.keys = undefined
      return system.transfer.effect
    })
    .on("42_TF_v_CLEANUP", () => {
      cleanHints()
      clear(context)
    })
} else {
  ipc
    .on("42_TF_^_EFFECT", (effect) => {
      applyEffect(effect, { bypassEmit: true })
    })
    .on("42_TF_^_REQUEST_EFFECT", (keys) => {
      context.keys = keys
      setEffect({ bypassEmit: true })
      context.keys = undefined
    })
    .on(
      "42_TF_^_START",
      async ({ x, y, items, dropzoneId, itemsConfig }, { iframe }) => {
        context.fromIframe = true

        const iframeCoord = getIframeInnerCoord(iframe)
        context.parentX = iframeCoord.x
        context.parentY = iframeCoord.y
        x += context.parentX
        y += context.parentY

        deserializeItems(items, context.parentX, context.parentY)
        cleanHints()

        const { itemsHint } = await makeHints({ itemsConfig })
        system.transfer.items = itemsHint
        system.transfer.itemsConfig = itemsConfig
        system.transfer.items.dropzoneId = dropzoneId
        system.transfer.items.start(x, y, items)
        for (const item of system.transfer.items) {
          document.documentElement.append(item.ghost)
        }

        await activateZones(x, y)
        setCurrentZone(x, y)

        system.transfer.items.drag(system.transfer.items.getCoord(x, y))

        for (const iframeDz of iframeDropzones) {
          if (iframeDz.el === iframe) {
            context.originIframeDropzone = iframeDz
            break
          }
        }
      }
    )
    .on("42_TF_^_DRAG", ({ x, y, coord }) => {
      if (context.parentX && system.transfer.items) {
        x += context.parentX
        y += context.parentY
        coord.x += context.parentX
        coord.y += context.parentY
        setCurrentZone(x, y)
        system.transfer.items.drag(coord)
      }
    })
    .on("42_TF_^_STOP", ({ x, y }) => {
      if (context.parentX && system.transfer.items) {
        if (system.transfer.currentZone?.hint.isIframe) {
          if (system.transfer.effect === "move") {
            system.transfer.items.removeGhosts()
          }
        } else if (context.originIframeDropzone) {
          context.originIframeDropzone.bus.emit("42_TF_v_REVERT", { x, y })
        }

        x += context.parentX
        y += context.parentY
        clear(context)
        haltZones(x, y)
      }
    })
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

    const ms = this.config.animationSpeed
    this.config.itemsConfig.startAnimation ??= { ms }
    this.config.itemsConfig.revertAnimation ??= { ms }
    this.config.itemsConfig.adoptAnimation ??= { ms }

    this.config.dropzoneConfig.animationSpeed = ms

    this.init()
  }

  async init() {
    const { signal } = this.cancel

    const { itemsConfig, dropzoneConfig } = this.config

    const { itemsHint, dropzoneHint } = await makeHints(
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
      applyTargetOffset: false,
      ...pick(this.config, ["selector", "distance", "useSelection"]),

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

        startPromise = getRects(targets, {
          all: this.config.selector,
          includeMargins: true,
        }).then(async (rects) => {
          if (this.list) {
            for (const item of rects) item.data = this.list[item.index]
          }

          system.transfer.items.start(x, y, rects)

          if (inIframe) {
            context.isOriginIframe = true
            const msg = { x, y, ...serializeItems({ hideGhost: true }) }
            await ipc.send("42_TF_^_START", msg)
          } else {
            await activateZones(x, y)
            setCurrentZone(x, y)
          }

          system.transfer.items.drag(system.transfer.items.getCoord(x, y))
          startReady = true
        })
      },

      drag(x, y) {
        if (!startReady) return
        if (inIframe) {
          const coord = system.transfer.items.getCoord(x, y)
          ipc.emit("42_TF_^_DRAG", { x, y, coord })
        } else {
          setCurrentZone(x, y)
          system.transfer.items.drag(system.transfer.items.getCoord(x, y))
        }
      },

      async stop(x, y) {
        startReady = false
        setCursor()
        forgetKeyevents()
        await startPromise

        if (inIframe) ipc.emit("42_TF_^_STOP", { x, y })
        else await haltZones(x, y)

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
