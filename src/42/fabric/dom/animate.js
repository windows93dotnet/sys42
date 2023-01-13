// @src https://youtu.be/9-6CKCz58A8

import ensureElement from "./ensureElement.js"
import distribute from "../type/object/distribute.js"

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

/**
 * @param {HTMLElement} el
 */
export async function cancelAnimations(el) {
  for (const anim of el.getAnimations()) anim.cancel()
}

function autoHideScrollbars(el) {
  if (el.classList.contains("scrollbar-invisible")) return false
  if (!(el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
    el.classList.add("scrollbar-invisible")
    return true
  }
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

  const restoreScrollbars = autoHideScrollbars(el)

  if (prefersReducedMotion) config.duration = 1
  else config.duration ??= config.ms ?? duration

  const anim = el.animate(
    to, //
    {
      easing: "ease-in-out",
      ...config,
      fill: "both",
    }
  )
  await anim.finished

  if (restoreScrollbars) el.classList.remove("scrollbar-invisible")

  // force rendered element
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

  const restoreScrollbars = autoHideScrollbars(el)

  if (prefersReducedMotion) config.duration = 1
  else config.duration ??= config.ms ?? duration

  const anim = el.animate(
    { ...from, offset: 0 },
    {
      easing: "ease-in-out",
      ...config,
      fill: "backwards",
    }
  )
  await anim.finished

  if (restoreScrollbars) el.classList.remove("scrollbar-invisible")

  return anim
}

export default {
  cancelAnimations,
  to: animateTo,
  from: animateFrom,
}
