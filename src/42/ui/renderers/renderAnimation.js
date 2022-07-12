import animate from "../../fabric/dom/animate.js"
import bisect from "../../fabric/type/object/bisect.js"
import setTemp from "../../fabric/dom/setTemp.js"

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
  const cL = document.body.classList
  if (cL.contains("motionless") || cL.contains("animation-0")) return

  const temp = { class: "action-0" }
  if ("x" in el && "y" in el) {
    temp.style = {
      transformOrigin: `calc(${el.x}px + 50%) calc(${el.y}px + 50%)`,
    }
  }

  const restore = setTemp(el, temp)
  return animate[how](el, keyframe, options).then(restore)
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
