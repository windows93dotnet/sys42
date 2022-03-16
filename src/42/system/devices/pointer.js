/* eslint-disable max-statements-per-line */

// @read https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/getCoalescedEvents
// @related https://github.com/nok/onedollar-unistroke-coffee
// @related http://depts.washington.edu/madlab/proj/dollar/ndollar.html
// @related http://depts.washington.edu/madlab/proj/dollar/ndollar.js
// @related https://github.com/GoogleChromeLabs/pointer-tracker

const primary = {}
const list = [primary]
const tracker = [undefined]

const resetFrom = (p) => {
  // p.fromTarget = null
  p.fromX = 0
  p.fromY = 0
}

const setFrom = (p, e) => {
  // p.fromTarget = e.target
  p.fromX = e.x
  p.fromY = e.y
}

const setPointer = (p, e) => {
  p.type = e.pointerType
  p.buttons = e.buttons
  p.pressure = e.pressure
  p.x = e.x
  p.y = e.y
  // p.tiltX = e.tiltX
  // p.tiltY = e.tiltY
  // p.offsetX = e.offsetX;
  // p.offsetY = e.offsetY;

  // prettier-ignore
  switch (e.buttons) {
    case 0: p.left = false; p.middle = false; p.right = false; break
    case 1: p.left = true; p.middle = false; p.right = false; break
    case 2: p.left = false; p.middle = false; p.right = true; break
    case 3: p.left = true; p.middle = false; p.right = true; break
    case 4: p.left = false; p.middle = true; p.right = false; break
    case 5: p.left = true; p.middle = true; p.right = false; break
    case 6: p.left = false; p.middle = true; p.right = true; break
    case 7: p.left = true; p.middle = true; p.right = true; break
    default:
  }

  return p
}

const pointerdown = (e) => {
  if (e.isPrimary) {
    setFrom(primary, e)
    setPointer(primary, e)
  } else {
    const i = tracker.push(e.pointerId) - 1
    list[i] = {}
    setFrom(list[i], e)
    setPointer(list[i], e)
  }
}

const pointerup = (e) => {
  if (e.isPrimary) {
    setPointer(primary, e)
    resetFrom(primary)
  } else {
    const i = tracker.indexOf(e.pointerId)
    if (i > -1) {
      tracker.splice(i, 1)
      list.splice(i, 1)
    }
  }
}

const pointermove = (e) => {
  if (e.isPrimary) {
    setPointer(primary, e)
  } else {
    const i = tracker.indexOf(e.pointerId)
    if (i > -1) setPointer(list[i], e)
  }
}

export const forget = () => {
  globalThis.removeEventListener("pointerdown", pointerdown, false)
  globalThis.removeEventListener("pointermove", pointermove, false)
  globalThis.removeEventListener("pointerup", pointerup, false)
  globalThis.removeEventListener("pointercancel", pointerup, false)
  pointer.isListening = false
}

export const listen = () => {
  if (pointer.isListening) return forget
  // TODO: check the following
  // touchActionBackup = document.body.style.touchAction
  // document.body.style.touchAction = "none"
  globalThis.addEventListener("pointerdown", pointerdown, false)
  globalThis.addEventListener("pointermove", pointermove, false)
  globalThis.addEventListener("pointerup", pointerup, false)
  globalThis.addEventListener("pointercancel", pointerup, false)
  pointer.isListening = true
  return forget
}

const pointer = { primary, list, listen, forget, isListening: false }
export default pointer
