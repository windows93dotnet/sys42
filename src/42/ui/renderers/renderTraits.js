import renderKeyVal from "./renderKeyVal.js"

export const TRAITS = [
  // "tooltip", //
  "movable",
  "positionable",
  "resizable",
  // "virtualizable",
]

const _INSTANCES = Symbol.for("Trait.INSTANCES")

export function renderTrait(el, key, val, ctx) {
  // hide until module load
  const originalOpacity = el.style.display
  if (key === "positionable") el.style.display = "none"

  const undone = import(`../trait/${key}.js`) //
    .then((m) => {
      if (key === "positionable") el.style.display = originalOpacity

      renderKeyVal(el, ctx, undefined, val, (el, _, val) => {
        if (val) {
          val = val === true ? {} : { ...val }
          val.signal = ctx.cancel.signal
          m.default(el, val)
        } else el[_INSTANCES]?.[key]?.destroy?.()
      })

      return `trait ${key}`
    })

  ctx.undones.push(undone)
}

export default function renderTraits(el, def, ctx) {
  for (const key of TRAITS) {
    if (key in def === false) continue
    renderTrait(el, key, def[key], ctx)
  }
}
