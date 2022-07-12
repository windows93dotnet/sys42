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

export default function renderAnimation(ctx, el, how, def) {
  return animate[how](el, ...bisect(def, keyframeEffectKeys))
}
