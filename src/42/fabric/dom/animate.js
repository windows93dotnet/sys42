// @src https://youtu.be/9-6CKCz58A8

/**
 * @param {HTMLElement} el
 * @param {PropertyIndexedKeyframes} from
 * @param {KeyframeAnimationOptions} options
 */
export async function animateFrom(el, from, options) {
  if (typeof options === "number") options = { duration: options }
  const anim = el.animate(
    { ...from, offset: 0 },
    {
      easing: "ease-in-out",
      duration: 300,
      ...options,
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
 */
export async function animateTo(el, to, options) {
  if (typeof options === "number") options = { duration: options }
  const anim = el.animate(
    to, //
    {
      easing: "ease-in-out",
      duration: 300,
      ...options,
      fill: "both",
    }
  )
  await anim.finished
  anim.commitStyles()
  anim.cancel()
  return anim
}

export default {
  to: animateTo,
  from: animateFrom,
}
