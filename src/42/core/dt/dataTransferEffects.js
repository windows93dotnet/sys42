const effectUnits = ["copy", "link", "move"]

const EFFECTS = {
  none: [],
  copyLink: ["copy", "link"],
  copyMove: ["copy", "move"],
  linkMove: ["link", "move"],
  all: effectUnits,
}

for (const item of effectUnits) EFFECTS[item] = [item]

EFFECTS.uninitialized = EFFECTS.all

const map = Object.fromEntries(
  Object.keys(EFFECTS).map((item) => [item.toLowerCase(), item])
)

map[""] = "none"
map.copylinkmove = "all"
map.uninitialized = "all"

export function fromOptions(effects) {
  if (!effects) return "all"

  if (typeof effects === "string") {
    if (effects in EFFECTS === false) {
      throw new Error(`Unknown effect: ${effects}`)
    }

    return effects === "uninitialized" ? "all" : effects
  }

  const key = effects.sort().join("").toLowerCase()
  if (key in map === false) throw new Error(`Unknown effect: ${key}`)
  return map[key]
}

export function fromString(effects) {
  return EFFECTS[effects] ?? EFFECTS.none
}

export function handleEffect(e, options) {
  if (options?.silentEffectCheck) {
    const allowed = fromString(e.dataTransfer.effectAllowed)
    if (e.ctrlKey && allowed.includes("copy")) {
      e.dataTransfer.dropEffect = "copy"
    } else if (e.shiftKey && allowed.includes("link")) {
      e.dataTransfer.dropEffect = "link"
    } else if (allowed.includes("move")) {
      e.dataTransfer.dropEffect = "move"
    }
  } else if (e.ctrlKey) {
    e.dataTransfer.dropEffect = "copy"
  } else if (e.shiftKey) {
    e.dataTransfer.dropEffect = "link"
  } else {
    e.dataTransfer.dropEffect = "move"
  }
}

export default { fromOptions, handleEffect }
