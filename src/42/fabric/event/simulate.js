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

export default function simulate(el, event, init) {
  if (typeof el === "string") {
    init = event
    event = el
    el = globalThis
  }

  const win =
    el.ownerDocument === document ? window : el.ownerDocument.defaultView
  const doc = el.ownerDocument

  if (event === "focus" && typeof el.focus === "function") {
    if (el !== win && !doc.hasFocus()) win.focus()
    el.focus()
  } else if (event === "blur" && typeof el.blur === "function") {
    el.blur()
  } else {
    const EventConstructor = event in EVENTS ? EVENTS[event] : CustomEvent
    const e = new EventConstructor(event, { ...DEFAULT, ...init })
    el.dispatchEvent(e)
  }
}
