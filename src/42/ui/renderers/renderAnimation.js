import animate from "../../fabric/dom/animate.js"
import distribute from "../../fabric/type/object/distribute.js"
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

  const temp = { class: { "action-0": true } }
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

  const [keyframe, options] = distribute(def, keyframeEffectKeys)

  if (how === "from" && !el.isConnected) {
    ctx.postrender.push(() => start(el, how, keyframe, options))
    return
  }

  return start(el, how, keyframe, options)
}
