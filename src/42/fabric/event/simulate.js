// prettier-ignore
const EVENT_TYPES = {
  AnimationEvent: "animationend animationiteration animationstart",
  AudioProcessingEvent: "audioprocess",
  BeforeUnloadEvent: "beforeunload",
  ClipboardEvent: "copy cut paste",
  CompositionEvent: "compositionend compositionstart compositionupdate",
  DeviceLightEvent: "devicelight",
  DeviceMotionEvent: "devicemotion",
  DeviceOrientationEvent: "deviceorientation",
  DragEvent: "drag dragend dragenter dragleave dragover dragstart drop",
  Event: "afterprint beforeprint cached canplay canplaythrough change chargingchange chargingtimechange checking close dischargingtimechange DOMContentLoaded downloading durationchange emptied ended fullscreenchange fullscreenerror input invalid levelchange loadeddata loadedmetadata noupdate obsolete offline online open orientationchange pause pointerlockchange pointerlockerror play playing ratechange readystatechange reset seeked seeking stalled submit success suspend timeupdate updateready visibilitychange volumechange waiting",
  FocusEvent: "blur focus focusin focusout",
  GamepadEvent: "gamepadconnected gamepaddisconnected",
  HashChangeEvent: "hashchange",
  KeyboardEvent: "keydown keypress keyup",
  MessageEvent: "message",
  MouseEvent: "click contextmenu dblclick mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup show",
  OfflineAudioCompletionEvent: "complete",
  PageTransitionEvent: "pagehide pageshow",
  PointerEvent : "auxclick pointerover pointerenter pointerdown pointermove pointerup pointercancel pointerout pointerleave gotpointercapture lostpointercapture",
  PopStateEvent: "popstate",
  ProgressEvent: "loadend loadstart progress timeout",
  StorageEvent: "storage",
  TouchEvent: "touchcancel touchend touchenter touchleave touchmove touchstart",
  TransitionEvent: "transitionend",
  UIEvent: "abort error resize scroll select unload",
  WheelEvent: "wheel",
}

const EVENTS = {}
for (const [key, val] of Object.entries(EVENT_TYPES)) {
  for (const event of val.split(" ")) {
    if (key in globalThis) EVENTS[event] = globalThis[key]
    else {
      EVENTS[event] = class UnknownEvent extends Event {
        constructor(type, init) {
          super(type, init)
          console.warn(
            `${event} will not dispatch using ${key} because it is undefined`,
          )
        }
      }
    }
  }
}

const DEFAULT = {
  bubbles: true,
  cancelable: true,
  composed: true,
}

const POINTEREVENT_DEFAULT = {
  ...DEFAULT,
  pointerId: 1,
  pointerType: "mouse",
  isPrimary: true,
  buttons: 1,
  pressure: 0.5,
}

export function simulate(el, event, init) {
  if (typeof el === "string") {
    init = event
    event = el
    el = globalThis
  }

  const doc = el.ownerDocument
  const view = doc?.defaultView ?? globalThis

  if (event === "focus" && typeof el.focus === "function") {
    if (el !== view && !doc.hasFocus()) {
      if (view !== globalThis) {
        // Firefox don't fire blur event on automated document focus change
        globalThis.dispatchEvent(new FocusEvent("blur", DEFAULT))
      }

      view.focus()
    }

    el.focus()
  } else if (event === "blur" && typeof el.blur === "function") {
    el.blur()
  } else {
    const EventConstructor = event in EVENTS ? EVENTS[event] : CustomEvent
    const e = new EventConstructor(event, {
      ...(EventConstructor === PointerEvent ? POINTEREVENT_DEFAULT : DEFAULT),
      ...init,
      view,
    })
    el.dispatchEvent(e)
  }
}

export default simulate
