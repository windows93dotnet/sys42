import animate from "../../fabric/dom/animate.js"
import bisect from "../../fabric/type/object/bisect.js"

const keyframeEffectKeys = [
  "composite",
  "delay",
  "direction",
  "duration",
  "easing",
  "endDelay",
  "ms",
]

function start(el, how, keyframe, options) {
  if ("x" in el && "y" in el) {
    console.log(how, el.x, el.y)
    el.style.left = el.x + "px"
    el.style.top = el.y + "px"
    el.style.transform = `translate(0px, 0px)`
  }

  return animate[how](el, keyframe, options)
}

export default async function renderAnimation(ctx, el, how, def) {
  await 0 // queueMicrotask

  const [keyframe, options] = bisect(def, keyframeEffectKeys)

  if (how === "from" && !el.isConnected) {
    ctx.postrender.push(() => start(el, how, keyframe, options))
    return
  }

  return start(el, how, keyframe, options)
}
