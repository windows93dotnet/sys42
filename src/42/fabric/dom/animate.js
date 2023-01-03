// @src https://youtu.be/9-6CKCz58A8

import distribute from "../type/object/distribute.js"

const OPTIONS_KEYWORDS = ["ms", "duration", "easing", "delay", "endDelay"]

const prm = window.matchMedia(`(prefers-reduced-motion: reduce)`)
let prefersReducedMotion = prm.matches
prm.onchange = (e) => (prefersReducedMotion = e.matches)

/**
 * @param {HTMLElement} el
 */
export async function cancelAnimations(el) {
  for (const anim of el.getAnimations()) anim.cancel()
}

/**
 * @param {HTMLElement} el
 * @param {object} options
 * @param {number} [duration]
 * @returns {Promise<Animation>}
 */
export async function animateFrom(el, options, duration = 240) {
  const [from, config] = distribute(options, OPTIONS_KEYWORDS)
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
  return anim
}

/**
 * @param {HTMLElement} el
 * @param {object} options
 * @param {number} [duration]
 * @returns {Promise<Animation>}
 */
export async function animateTo(el, options, duration = 240) {
  const [to, config] = distribute(options, OPTIONS_KEYWORDS)
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
  if (el.isConnected) anim.commitStyles()
  anim.cancel()
  return anim
}

export default {
  cancelAnimations,
  to: animateTo,
  from: animateFrom,
}
