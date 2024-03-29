// @read https://www.w3.org/wiki/PF/ARIA/BestPractices/DragDrop

/* eslint-disable complexity */
import system from "../../system.js"
import Trait from "../classes/Trait.js"
import Dragger from "../classes/Dragger.js"
import setTemp from "../../fabric/dom/setTemp.js"
import inIframe from "../../core/env/realm/inIframe.js"
import getRects from "../../fabric/dom/getRects.js"
import pick from "../../fabric/type/object/pick.js"
import serialize from "../../fabric/type/any/serialize.js"
import settings from "../../core/settings.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import removeItem from "../../fabric/type/array/removeItem.js"
// import HoverScroll from "../classes/HoverScroll.js"
import setCursor from "../../fabric/dom/setCursor.js"
import keyboard from "../../core/devices/keyboard.js"
import listen from "../../fabric/event/listen.js"
import arrify from "../../fabric/type/any/arrify.js"
import defer from "../../fabric/type/promise/defer.js"
import dragEntrance from "../../core/dt/dragEntrance.js"
import parseMimetype from "../../fabric/type/file/parseMimetype.js"

const DEFAULTS = {
  selector: ":scope > *",
  distance: 2,
  useSelection: true,
  handlerSelector: undefined,
  accept: undefined,
  findNewIndex: true,
  effects: ["move", "copy", "link"],

  items: "stack",
  dropzone: "slide",

  animationSpeed: 180,
}

const configure = settings("ui.trait.transferable", DEFAULTS)

/* effect
========= */

const keyToEffect = [
  ["control", "copy"],
  ["shift", "move"],
  ["alt", "link"],
]

const effectToCursor = {
  none: "no-drop",
  move: "grabbing",
  copy: "copy",
  link: "alias",
}

function applyEffect(name, options) {
  system.transfer.effect = name

  if (!system.transfer.dataTransfer) {
    if (options?.bypassEmit !== true) {
      if (context.fromIframe) {
        context.originIframeDropzone?.bus.emit("42_TF_v_EFFECT", name)
      } else if (inIframe) {
        ipc.emit("42_TF_^_EFFECT", name)
      }
    }

    setCursor(effectToCursor[name])
  }
}

function setEffect(options) {
  if (system.transfer.currentZone) {
    const keys = context.keys ?? keyboard.keys
    if (system.transfer.currentZone.isIframe) {
      system.transfer.currentZone.bus
        .send("42_TF_v_REQUEST_EFFECT", keys)
        .then((effect) => {
          applyEffect(effect ?? "none", options)
        })
    } else {
      const { effects } = system.transfer.currentZone.config
      for (const [key, effect] of keyToEffect) {
        if (key in keys && effects.includes(effect)) {
          return applyEffect(effect, options)
        }
      }

      applyEffect(
        system.transfer.currentZone.isOriginDropzone
          ? "move" // sort
          : effects[0],
        options,
      )
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
    undones[0] = import(`./transferable/${itemsConfig.type}ItemsHint.js`) //
      .then((m) => m.default(itemsConfig))
  }

  if (dropzoneConfig) {
    undones[1] = import(`./transferable/${dropzoneConfig.type}DropzoneHint.js`) //
      .then((m) => m.default(el, dropzoneConfig))
  }

  const [itemsHint, dropzoneHint] = await Promise.all(undones)
  if (dropzoneHint && itemsHint) itemsHint.dropzoneId = dropzoneHint.el.id
  return { itemsHint, dropzoneHint }
}

function activateZones(x, y) {
  if (system.transfer.active === true) return
  system.transfer.active = true
  for (const dropzone of system.transfer.dropzones.values()) {
    // zone.hoverScroll = new HoverScroll(zone.el, zone.config?.hoverScroll)
    dropzone.activate(x, y)
  }

  const iframes = document.querySelectorAll("iframe")
  for (let i = 0, l = iframes.length; i < l; i++) {
    if (iframes[i].closest(".transferable-ignore")) continue
    const dropzone = new IframeDropzoneHint(iframes[i], i)
    system.transfer.dropzones.set(dropzone.el, dropzone)
  }
}

function stopTranfer() {
  for (const dropzone of system.transfer.dropzones.values()) {
    dropzone.halt()
    dropzone.hoverScroll?.clear()
  }

  cleanHints()
  system.transfer.active = false
}

async function haltZones(x, y, mode) {
  if (system.transfer.currentZone) {
    mode ??= await system.transfer.currentZone.import()
  }

  if (system.transfer.currentZone && mode === undefined) {
    await system.transfer.currentZone.drop(x, y)
  } else if (mode === "adopt") {
    system.transfer.effect = "move"
  } else if (mode === "revert") {
    system.transfer.effect = "none"
  } else if (mode === "vanish") {
    system.transfer.effect = "none"
    system.transfer.items.removeGhosts()
    return void stopTranfer()
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
      }`,
    )
  }

  stopTranfer()
}

function checkKind(accept, noKind) {
  if (accept.kind.length > 0) {
    for (const kind of accept.kind) {
      if (system.transfer.items.kind.includes(kind)) return true
    }

    return false
  }

  return noKind
}

function checkMimetype(mimetype) {
  for (const { type, subtype } of mimetype) {
    let ok = false

    for (const item of system.transfer.items.details.dataTypes) {
      if (
        (type === "*" || item.type === type) &&
        (subtype === "*" || item.subtype === subtype)
      ) {
        ok = item
      }
    }

    if (ok) return ok
  }

  return false
}

function checkAccept(dropzone) {
  if (dropzone.isIframe) return true
  const { accept } = dropzone.config

  if (system.transfer.items.details.dataTypes) {
    if (accept.mimetype && checkMimetype(accept.mimetype)) return true
  }

  if (accept.element) {
    if (accept.element === true) return checkKind(accept, true)

    return (
      system.transfer.items.every(
        typeof accept.element === "function"
          ? accept.element
          : ({ target }) => target.matches(accept.element),
      ) && checkKind(accept, true)
    )
  }

  // TODO: add schema validation for item.data

  return checkKind(accept, false)
}

const dragoverZone = (x, y) => {
  if (
    !system.transfer.currentZone ||
    system.transfer.currentZone?.config?.findNewIndex === false
  ) {
    return
  }

  system.transfer.currentZone.hoverScroll?.update({ x, y }, async () => {
    await system.transfer.currentZone?.scan()
    system.transfer.currentZone?.dragover(x, y)
  })
  system.transfer.currentZone.dragover(x, y)
}

const setCurrentZone = (x, y) => {
  let currentZone

  const elements = document.elementsFromPoint(x, y)
  const [target] = elements

  for (const el of elements) {
    if (system.transfer.dropzones.has(el) && el.contains(target)) {
      const zone = system.transfer.dropzones.get(el)
      if (checkAccept(zone)) {
        currentZone = zone
        break
      }
    }
  }

  if (system.transfer.currentZone) {
    if (system.transfer.currentZone === currentZone) {
      dragoverZone(x, y)
      return
    }

    system.transfer.currentZone.hoverScroll?.clear()
    system.transfer.currentZone.leave(x, y)
    system.transfer.currentZone = undefined
  }

  if (currentZone) {
    system.transfer.currentZone = currentZone
    setEffect()
    system.transfer.currentZone.enter(x, y)
    dragoverZone(x, y)
  } else setEffect()
}

/* ipc
====== */

import ipc from "../../core/ipc.js"
import sanitize from "../../fabric/dom/sanitize.js"
import clear from "../../fabric/type/object/clear.js"

const context = Object.create(null)

function serializeItems({ hideGhost, x = 0, y = 0 }) {
  const items = []

  const { originDropzone } = system.transfer.items

  for (const item of system.transfer.items) {
    const exportedItem = { ...item }
    exportedItem.x -= x
    exportedItem.y -= y

    if (exportedItem.target) {
      exportedItem.target = exportedItem.target.cloneNode(true)
      originDropzone?.reviveTarget(exportedItem.target)
      exportedItem.target = exportedItem.target.outerHTML
      exportedItem.ghost = exportedItem.ghost.outerHTML
    }

    if (exportedItem.data) exportedItem.data = serialize(exportedItem.data)
    if (hideGhost) item.ghost.classList.add("hide")
    items.push(exportedItem)
  }

  const { dropzoneId, details } = system.transfer.items
  const { itemsConfig } = system.transfer

  return { items, dropzoneId, itemsConfig, details }
}

function deserializeItems(items, parentX = 0, parentY = 0) {
  for (const item of items) {
    if (item.target) {
      item.target =
        (context.isOriginIframe
          ? document.querySelector(`#${item.id}`)
          : undefined) ?? sanitize(item.target)
      item.ghost = sanitize(item.ghost)
    }

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
  const rect = iframe.getBoundingClientRect()
  const { borderTopWidth, borderLeftWidth } = getComputedStyle(iframe)
  rect.innerX = rect.x + Number.parseInt(borderLeftWidth, 10)
  rect.innerY = rect.y + Number.parseInt(borderTopWidth, 10)
  return rect
}

class IframeDropzoneHint {
  constructor(iframe, index) {
    this.iframe = iframe
    this.bus = ipc.to(iframe, { ignoreUnresponsive: true })
    this.isIframe = true

    const rect = getIframeInnerCoord(iframe)
    this.x = rect.innerX
    this.y = rect.innerY
    this.el = document.createElement("div")

    this.el.style = `
      position: fixed;
      z-index: ${100_000 + index /* TODO: calculate top zIndex */};
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      /* background: rgba(255,0,0,0.2); */`
    document.documentElement.append(this.el)
  }

  #substractCoord(x, y) {
    return { x: x - this.x, y: y - this.y }
  }

  scan() {}
  activate() {}

  halt() {
    system.transfer.dropzones.delete(this.el)
    this.el?.remove()
    this.el = undefined
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

  async import() {
    return this.bus.send("42_TF_v_IMPORT")
  }

  async drop(x, y) {
    const { effect, items } = system.transfer
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (effect !== "none") items.removeGhosts()
        if (effect === "move") items.hideTargets()
      })
    })
    await this.bus.send("42_TF_v_DROP", this.#substractCoord(x, y))
  }

  async destroy() {
    // TODO: debug ipc Sender.destroy
    // this.bus.destroy()
  }
}

if (inIframe) {
  let enterReady
  ipc
    .on(
      "42_TF_v_ENTER",
      async ({ x, y, items, itemsConfig, dropzoneId, details }) => {
        enterReady = defer()
        deserializeItems(items)

        const { itemsHint } = await makeHints({ itemsConfig })

        system.transfer.items = itemsHint
        system.transfer.itemsConfig = itemsConfig
        system.transfer.items.dropzoneId = dropzoneId
        system.transfer.items.details = details
        system.transfer.items.start(x, y, items)

        activateZones(x, y)
        setCurrentZone(x, y)
        enterReady.resolve()
      },
    )
    .on("42_TF_v_LEAVE", async ({ x, y }) => {
      await enterReady
      enterReady = undefined
      if (system.transfer.currentZone) {
        system.transfer.currentZone.hoverScroll?.clear()
        system.transfer.currentZone.leave(x, y)
        system.transfer.currentZone = undefined
      }
    })
    .on("42_TF_v_DRAGOVER", ({ x, y }) => {
      if (enterReady?.isResolved) setCurrentZone(x, y)
    })
    .on("42_TF_v_IMPORT", async () => {
      if (system.transfer.currentZone) {
        return system.transfer.currentZone.import()
      }
    })
    .on("42_TF_v_DETAILS", (details) => {
      system.transfer.items.details = details
    })
    .on("42_TF_v_DROP", async ({ x, y }) => {
      if (system.transfer.effect === "none") haltZones(x, y)
      else await haltZones(x, y)
    })
    .on("42_TF_v_REVERT", async ({ x, y, mode }) => {
      haltZones(x, y, mode)
    })
    .on("42_TF_v_EFFECT", (effect) => {
      applyEffect(effect, { bypassEmit: true })
    })
    .on("42_TF_v_REQUEST_EFFECT", async (keys) => {
      context.keys = keys
      await setEffect({ bypassEmit: true })
      return system.transfer.effect
    })
    .on("42_TF_v_CLEANUP", () => {
      enterReady = undefined
      stopTranfer()
      clear(context)
    })
} else {
  ipc
    .on("42_TF_^_EFFECT", (effect) => {
      applyEffect(effect, { bypassEmit: true })
    })
    .on("42_TF_^_REQUEST_EFFECT", (keys) => {
      context.keys = keys
      setEffect()
    })
    .on(
      "42_TF_^_START",
      async ({ x, y, items, dropzoneId, itemsConfig, details }, { iframe }) => {
        const iframeCoord = getIframeInnerCoord(iframe)
        context.parentX = iframeCoord.innerX
        context.parentY = iframeCoord.innerY
        x += context.parentX
        y += context.parentY

        deserializeItems(items, context.parentX, context.parentY)
        cleanHints()

        const { itemsHint } = await makeHints({ itemsConfig })
        system.transfer.items = itemsHint
        system.transfer.itemsConfig = itemsConfig
        system.transfer.items.dropzoneId = dropzoneId
        system.transfer.items.details = details

        system.transfer.items.start(x, y, items)

        for (const item of system.transfer.items) {
          document.documentElement.append(item.ghost)
        }

        activateZones(x, y)
        setCurrentZone(x, y)

        system.transfer.items.drag(system.transfer.items.getCoord(x, y))

        for (const dropzone of system.transfer.dropzones.values()) {
          if (dropzone.iframe === iframe) {
            context.originIframeDropzone = dropzone
            break
          }
        }

        context.fromIframe = true
      },
    )
    .on("42_TF_^_DRAG", ({ x, y, coord }) => {
      if (context.fromIframe && system.transfer.items) {
        x += context.parentX
        y += context.parentY
        coord.x += context.parentX
        coord.y += context.parentY
        setCurrentZone(x, y)
        system.transfer.items.drag(coord)
      }
    })
    .on("42_TF_^_STOP", async ({ x, y }) => {
      if (context.fromIframe && system.transfer.items) {
        x += context.parentX
        y += context.parentY

        let mode

        if (system.transfer.currentZone?.isIframe) {
          if (system.transfer.effect === "move") {
            system.transfer.items.removeGhosts()
          }
        } else if (context.originIframeDropzone) {
          if (system.transfer.currentZone) {
            mode = await system.transfer.currentZone.import()
          }

          const { bus } = context.originIframeDropzone
          await bus.send("42_TF_v_REVERT", { x, y, mode })
        }

        haltZones(x, y, mode)
        clear(context)
      }
    })
}

if (!inIframe) {
  let started
  dragEntrance({
    async start({ x, y, dataTransfer }) {
      cleanHints()

      const dataTypes = []

      for (const { type } of dataTransfer.items) {
        dataTypes.push(parseMimetype(type))
      }

      const items = [{ x, y, height: 32, width: 32 }]
      const itemsConfig = { type: "invisible" }
      const { itemsHint } = await makeHints({ itemsConfig })
      system.transfer.items = itemsHint
      system.transfer.items.details.dataTypes = dataTypes
      system.transfer.itemsConfig = itemsConfig
      system.transfer.items.start(x, y, items)

      activateZones(x, y)
      setCurrentZone(x, y)

      system.transfer.items.drag(system.transfer.items.getCoord(x, y))
      started = true
    },
    drag(e) {
      if (!started) return

      setCurrentZone(e.x, e.y)
      setEffect()

      e.dataTransfer.dropEffect = system.transfer.effect
      system.transfer.items.drag(e)
    },
    async stop({ x, y }) {
      started = false
      await haltZones(x, y)
    },
    async drop(imports) {
      Object.assign(system.transfer.items.details, imports)
      if (system.transfer.currentZone.isIframe) {
        const { bus } = system.transfer.currentZone
        await bus.send("42_TF_v_DETAILS", system.transfer.items.details)
      }
    },
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

    const { position } = getComputedStyle(this.el)
    if (position === "static") {
      const { signal } = this.cancel
      setTemp(this.el, { signal, style: { position: "relative" } })
    }

    const itemsConfig =
      typeof this.config.items === "string"
        ? { type: this.config.items }
        : this.config.items
    const dropzoneConfig =
      typeof this.config.dropzone === "string"
        ? { type: this.config.dropzone }
        : this.config.dropzone

    if (typeof this.config.accept === "string") {
      this.config.accept = { kind: this.config.accept }
    }

    this.config.kind ??= this.list ? "42_LIST_KIND" : undefined

    dropzoneConfig.signal ??= this.cancel.signal
    dropzoneConfig.selector ??= this.config.selector
    dropzoneConfig.orientation ??= this.config.orientation
    dropzoneConfig.freeAxis ??= this.config.freeAxis
    dropzoneConfig.indexChange ??= this.config.indexChange
    dropzoneConfig.findNewIndex ??= this.config.findNewIndex
    dropzoneConfig.import ??= this.config.import
    dropzoneConfig.list = this.list

    dropzoneConfig.accept ??=
      this.config.accept ?? (this.list ? { element: false } : { element: true })

    if (dropzoneConfig.accept.element === "*") {
      dropzoneConfig.accept.element = true
    }

    dropzoneConfig.accept.kind ??= this.config.kind
    dropzoneConfig.accept.kind = arrify(dropzoneConfig.accept.kind)

    if (dropzoneConfig.accept.mimetype) {
      dropzoneConfig.accept.mimetype = arrify(
        dropzoneConfig.accept.mimetype,
      ).map((x) => parseMimetype(x))
    }

    dropzoneConfig.effects ??= arrify(
      options.effects ??
        (this.list
          ? ["move", "copy"]
          : options.accept &&
              Object.keys(options.accept).every((x) => x === "mimetype")
            ? ["copy"]
            : this.config.effects),
    )

    const ms = this.config.animationSpeed
    if (itemsConfig) {
      itemsConfig.startAnimation ??= { ms }
      itemsConfig.revertAnimation ??= { ms }
      itemsConfig.adoptAnimation ??= { ms }
      itemsConfig.kind ??= arrify(this.config.kind)
    }

    dropzoneConfig.animationSpeed = ms

    this.init(itemsConfig, dropzoneConfig)
  }

  async init(itemsConfig, dropzoneConfig) {
    const { signal } = this.cancel

    const { itemsHint, dropzoneHint } = await makeHints(
      { itemsConfig, dropzoneConfig },
      this.el,
    )

    if (dropzoneHint) {
      system.transfer.dropzones.set(this.el, dropzoneHint)
    }

    if (!itemsHint) return

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

        let targets = []
        let targetsData

        if (this.config.useSelection) {
          const selectable = this.el[Trait.INSTANCES]?.selectable
          if (selectable) {
            targetsData = new WeakMap()
            selectable.ensureSelected(target)
            const { elements, selection } = selectable

            for (let i = 0, l = elements.length; i < l; i++) {
              targetsData.set(elements[i], selection[i])
              targets.push(elements[i])
            }

            // always set the clicked target in top of list
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
          } else if (targetsData) {
            for (const item of rects) {
              item.data = targetsData.get(item.target)
            }
          }

          system.transfer.items.start(x, y, rects)
          if (this.config.export) await this.config.export(system.transfer)

          if (inIframe) {
            context.isOriginIframe = true
            const msg = { x, y, ...serializeItems({ hideGhost: true }) }
            await ipc.send("42_TF_^_START", msg)
          } else {
            activateZones(x, y)
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
      },
    })
  }

  destroy() {
    super.destroy()
    system.transfer.dropzones.get(this.el)?.halt()
    system.transfer.dropzones.delete(this.el)
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
