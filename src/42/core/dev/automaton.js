// @related https://github.com/Rich-Harris/simulant
// @related https://devexpress.github.io/testcafe/documentation/test-api/actions/action-options.html#click-action-options

import defer from "../../fabric/type/promise/defer.js"
import mark from "../../fabric/type/any/mark.js"
import asyncable from "../../fabric/traits/asyncable.js"

const { ELEMENT_NODE } = Node

// prettier-ignore
const EVENT_TYPES = {
  UIEvent: "abort error resize scroll select unload",
  Event: "afterprint beforeprint cached canplay canplaythrough change chargingchange chargingtimechange checking close dischargingtimechange DOMContentLoaded downloading durationchange emptied ended fullscreenchange fullscreenerror input invalid levelchange loadeddata loadedmetadata noupdate obsolete offline online open orientationchange pause pointerlockchange pointerlockerror play playing ratechange readystatechange reset seeked seeking stalled submit success suspend timeupdate updateready visibilitychange volumechange waiting",
  AnimationEvent: "animationend animationiteration animationstart",
  AudioProcessingEvent: "audioprocess",
  BeforeUnloadEvent: "beforeunload",
  FocusEvent: "blur focus focusin focusout",
  MouseEvent: "click contextmenu dblclick mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup show",
  OfflineAudioCompletionEvent: "complete",
  CompositionEvent: "compositionend compositionstart compositionupdate",
  ClipboardEvent: "copy cut paste",
  DeviceLightEvent: "devicelight",
  DeviceMotionEvent: "devicemotion",
  DeviceOrientationEvent: "deviceorientation",
  DragEvent: "drag dragend dragenter dragleave dragover dragstart drop",
  GamepadEvent: "gamepadconnected gamepaddisconnected",
  HashChangeEvent: "hashchange",
  KeyboardEvent: "keydown keypress keyup",
  ProgressEvent: "loadend loadstart progress timeout",
  MessageEvent: "message",
  PageTransitionEvent: "pagehide pageshow",
  PopStateEvent: "popstate",
  StorageEvent: "storage",
  TouchEvent: "touchcancel touchend touchenter touchleave touchmove touchstart",
  TransitionEvent: "transitionend",
  WheelEvent: "wheel",
}

const EVENTS = {}
for (const [key, val] of Object.entries(EVENT_TYPES)) {
  for (const event of val.split(" ")) {
    if (key in globalThis) EVENTS[event] = globalThis[key]
    else {
      EVENTS[event] = class UnknownEvent extends Event {
        constructor(...args) {
          super(...args)
          console.warn(
            `${event} will not dispatch using ${key} because it is undefined`
          )
        }
      }
    }
  }
}

const DEFAULT = {
  bubbles: true,
  cancelable: true,
}

function normalizeTarget(val) {
  const type = typeof val
  const target = type === "string" ? document.querySelector(val) : val
  if (target?.nodeType === ELEMENT_NODE) return target

  if (typeof target?.dispatchEvent !== "function") {
    throw new TypeError(
      `The "target" argument must be an EventTarget or a valid css selector: ${
        type === "string" ? val : type
      }`
    )
  }

  return target
}

export class Automaton {
  #deferred = []
  #pendingKeys = new Map()
  #instances = []

  constructor(target) {
    this.el = normalizeTarget(target)

    asyncable(this, { lazy: true }, async () => {
      this.cleanup()
      await Promise.all(this.#deferred)
    })
  }

  target(target) {
    const instance = new Automaton(target)
    this.#instances.push(instance)
    return instance
  }

  select() {
    this.el.select?.()
    return this
  }

  focus() {
    if ("focus" in this.el) this.el.focus()
    else this.dispatch("focus")
    return this
  }

  click() {
    if ("click" in this.el) this.el.click()
    else this.dispatch("click")
    return this
  }

  dbclick() {
    this.dispatch("dbclick")
    return this
  }

  contextmenu() {
    this.dispatch("contextmenu")
    return this
  }

  keydown(init) {
    this.#pendingKeys.set(mark(init), init)
    this.dispatch("keydown", init)
    return this
  }

  keyup(init) {
    this.#pendingKeys.delete(mark(init))
    this.dispatch("keyup", init)
    return this
  }

  keystroke(init) {
    const deferred = defer()
    this.#deferred.push(deferred)
    this.#pendingKeys.set(mark(init), init)
    this.dispatch("keydown", init)
    setTimeout(() => {
      this.dispatch("keyup", init)
      this.#pendingKeys.delete(mark(init))
      setTimeout(() => deferred.resolve(), 0)
    }, 0)
    return this
  }

  dispatch(event, init = {}) {
    const EventConstructor = event in EVENTS ? EVENTS[event] : CustomEvent
    this.el.dispatchEvent(new EventConstructor(event, { ...DEFAULT, ...init }))
    const deferred = defer()
    this.#deferred.push(deferred)
    setTimeout(() => deferred.resolve(), 0)
    return this
  }

  cleanup() {
    for (const pending of this.#pendingKeys.values()) this.keyup(pending)
    for (const instance of this.#instances) instance.cleanup()
    this.#instances.length = 0
    return this
  }
}

export default new Automaton(globalThis)
