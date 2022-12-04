// @src https://youtu.be/9-6CKCz58A8

function configure(options = {}) {
  if (typeof options === "number") return { duration: options }
  if ("ms" in options) options.duration = options.ms
  return options
}

/**
 * @param {HTMLElement} el
 * @param {PropertyIndexedKeyframes} from
 * @param {KeyframeAnimationOptions} options
 * @returns {Promise<Animation>}
 */
export async function animateFrom(el, from, options) {
  const config = configure(options)
  const anim = el.animate(
    { ...from, offset: 0 },
    {
      easing: "ease-in-out",
      duration: 240,
      ...config,
      fill: "backwards",
    }
  )
  await anim.finished
  return anim
}

/**
 * @param {HTMLElement} el
 * @param {Keyframe[] | PropertyIndexedKeyframes} to
 * @param {KeyframeAnimationOptions} options
 * @returns {Promise<Animation>}
 */
export async function animateTo(el, to, options) {
  const config = configure(options)
  const anim = el.animate(
    to, //
    {
      easing: "ease-in-out",
      duration: 240,
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
  to: animateTo,
  from: animateFrom,
}
