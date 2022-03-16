// @src https://github.com/jquery/jquery-mousewheel/blob/master/jquery.mousewheel.js
// @src https://stackoverflow.com/questions/20110224/what-is-the-height-of-a-line-in-a-wheel-event-deltamode-dom-delta-line
// @read https://github.com/jquery/jquery-mousewheel/issues/36
// @related https://github.com/Promo/wheel-indicator
// @related https://github.com/facebook/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js

const { DOM_DELTA_LINE, DOM_DELTA_PAGE } = WheelEvent
const { max, abs, floor, ceil /* , clamp */ } = Math

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

const axis = {
  x: 0,
  y: 0,
  factorX: 0,
  factorY: 0,
}

let lowestDelta = Infinity
let timerId

const PAGE_HEIGHT = window.innerHeight
const LINE_HEIGHT = getScrollLineHeight()

function getScrollLineHeight() {
  const span = document.createElement("span")
  span.textContent = "A"
  document.body.append(span)
  const { offsetHeight } = span
  span.remove()
  return max(offsetHeight, 12)
}

function reset() {
  axis.x = 0
  axis.y = 0
  lowestDelta = Infinity
}

function handler({ deltaY, deltaX, deltaMode }) {
  if (deltaMode === DOM_DELTA_LINE) {
    deltaY *= LINE_HEIGHT
    deltaX *= LINE_HEIGHT
  } else if (deltaMode === DOM_DELTA_PAGE) {
    deltaY *= PAGE_HEIGHT
    deltaX *= PAGE_HEIGHT
  }

  const absDelta = max(abs(deltaY), abs(deltaX))
  if (absDelta < lowestDelta) lowestDelta = absDelta

  deltaX = (deltaX > 1 ? floor : ceil)(deltaX / lowestDelta)
  deltaY = (deltaY > 1 ? floor : ceil)(deltaY / lowestDelta)

  axis.x = clamp(deltaX, -1, 1)
  axis.y = clamp(deltaY, -1, 1)
  axis.factorX = abs(lowestDelta * deltaX)
  axis.factorY = abs(lowestDelta * deltaY)

  clearTimeout(timerId)
  timerId = setTimeout(reset, 200)
}

const listenerOptions = {
  capture: true,
  passive: true,
}

export const forget = () => {
  globalThis.removeEventListener("wheel", handler, listenerOptions)
  wheel.isListening = false
}

export const listen = () => {
  if (wheel.isListening) return forget
  globalThis.addEventListener("wheel", handler, listenerOptions)
  wheel.isListening = true
  return forget
}

const wheel = { axis, listen, forget, isListening: false }
export default wheel
