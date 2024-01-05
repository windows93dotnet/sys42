// @src https://youtu.be/9-6CKCz58A8

import ensureElement from "./ensureElement.js"
import distribute from "../type/object/distribute.js"
import untilRepaint from "../type/promise/untilRepaint.js"

const OPTIONS_KEYWORDS = [
  "ms",
  "duration",
  "easing",
  "delay",
  "endDelay",
  "autoHideScrollbars",
]
const FORCE_DISPLAY = "display: block !important;"

const prm = window.matchMedia(`(prefers-reduced-motion: reduce)`)
let prefersReducedMotion = prm.matches
prm.onchange = (e) => (prefersReducedMotion = e.matches)

function hideScrollbars(el) {
  if (el.classList.contains("scrollbar-invisible")) return false
  if (!(el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
    el.classList.add("scrollbar-invisible")
    return true
  }
}

/** @param {HTMLElement} el */
export async function cancelAnimations(el) {
  for (const anim of el.getAnimations()) anim.cancel()
}

/**
 * @param {HTMLElement} el
 * @param {object} options
 * @param {number} [duration]
 * @returns {Promise<Animation>}
 */
export async function animateTo(el, options, duration = 240) {
  el = ensureElement(el)
  const [to, config] = distribute(options, OPTIONS_KEYWORDS)

  if ("height" in to) el.style.height = `${el.offsetHeight}px`
  if ("width" in to) el.style.width = `${el.offsetWidth}px`

  const shouldRestoreScrollbars = hideScrollbars(el)

  if (prefersReducedMotion) config.duration = 1
  else config.duration ??= config.ms ?? duration

  const anim = el.animate(
    to, //
    {
      easing: "ease-in-out",
      ...config,
      fill: "both",
    },
  )
  await anim.finished

  if (shouldRestoreScrollbars) el.classList.remove("scrollbar-invisible")

  // force rendered element to commit styles
  const { display } = el.style
  el.style.cssText += FORCE_DISPLAY
  const { isConnected } = el
  if (!isConnected) document.documentElement.append(el)

  anim.commitStyles()

  // restore forced
  el.style.cssText = el.style.cssText.replace(FORCE_DISPLAY, "")
  el.style.display = display
  if (!isConnected) el.remove()

  anim.cancel()
  return anim
}

/**
 * @param {HTMLElement} el
 * @param {object} options
 * @param {number} [duration]
 * @returns {Promise<Animation>}
 */
export async function animateFrom(el, options, duration = 240) {
  el = ensureElement(el)
  const [from, config] = distribute(options, OPTIONS_KEYWORDS)

  let heightBkp
  let widthBkp
  const hasHeightAnim = "height" in from
  const hasWidthAnim = "width" in from
  if (hasHeightAnim || hasWidthAnim) {
    // prevent FOUC
    if (hasHeightAnim) {
      heightBkp = el.style.height
      el.style.height = from.height
    }

    if (hasWidthAnim) {
      widthBkp = el.style.width
      el.style.width = from.width
    }

    // ensure el.offsetHeight is defined
    await untilRepaint()

    if (hasHeightAnim) {
      el.style.height = heightBkp
      el.style.height = `${el.offsetHeight}px`
    }

    if (hasWidthAnim) {
      el.style.width = widthBkp
      el.style.width = `${el.offsetWidth}px`
    }
  }

  const restoreScrollbars = hideScrollbars(el)

  if (prefersReducedMotion) config.duration = 1
  else config.duration ??= config.ms ?? duration

  const anim = el.animate(
    { ...from, offset: 0 },
    {
      easing: "ease-in-out",
      ...config,
      fill: "backwards",
    },
  )
  await anim.finished

  if (heightBkp !== undefined) el.style.height = heightBkp
  if (widthBkp !== undefined) el.style.width = widthBkp
  if (restoreScrollbars) el.classList.remove("scrollbar-invisible")

  return anim
}

export default {
  cancel: cancelAnimations,
  to: animateTo,
  from: animateFrom,
}
