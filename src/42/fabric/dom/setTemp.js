import cssPrefix from "./cssPrefix.js"
import setStyles from "./setStyles.js"
import setClasses from "./setClasses.js"

const saveStyles = ({ style }, list) => {
  const saved = Object.create(null)

  for (const name of list) {
    const prefixed = cssPrefix(name)
    if (prefixed) saved[prefixed] = prefixed in style ? style[prefixed] : ""
    saved[name] = name in style ? style[name] : ""
  }

  return saved
}

const saveClasses = (el, val) => {
  let saved

  if (typeof val === "string") val = val.split(" ")

  if (Array.isArray(val)) {
    saved = Object.fromEntries([...el.classList].map((x) => [x, true]))
    for (const x of val) if (x in saved === false) saved[x] = false
  } else {
    saved = {}
    for (const keys of Object.keys(val)) {
      for (const key of keys.split(" ")) {
        saved[key] = el.classList.contains(key)
      }
    }
  }

  return saved
}

const saveAttributes = (el, attr) => {
  const saved = []

  for (const [key, val] of attr) {
    if (typeof val === "boolean") {
      saved.push([key, key in el ? el[key] : el.hasAttribute(key)])
    } else {
      saved.push([key, el.getAttribute(key)])
    }
  }

  return saved
}

const setAttributes = (el, attr) => {
  for (const [key, val] of attr) {
    if (key in el) el[key] = val
    else if (val == null) el.removeAttribute(key)
    else if (typeof val === "boolean") el.toggleAttribute(key, val)
    else el.setAttribute(key, val)
  }
}

export default function setTemp(el, ...options) {
  const restores = []
  const attributes = []
  const signals = []

  for (const item of options) {
    for (const [key, val] of Object.entries(item)) {
      if (key === "signal") {
        val.addEventListener("abort", restore)
        signals.push(val)
      } else if (key === "style") {
        const isArray = Array.isArray(val)
        const saved = saveStyles(el, isArray ? val : Object.keys(val))
        if (!isArray) setStyles(el, val)
        restores.push(() => setStyles(el, saved))
      } else if (key === "class") {
        const saved = saveClasses(el, val)
        setClasses(el, val)
        restores.push(() => setClasses(el, saved))
      } else {
        for (const k of key.split(" ")) attributes.push([k, val])
      }
    }
  }

  if (attributes.length > 0) {
    const saved = saveAttributes(el, attributes)
    setAttributes(el, attributes)
    restores.push(() => setAttributes(el, saved))
    attributes.length = 0
  }

  function restore() {
    for (const restore of restores) restore()
    for (const signal of signals) signal.removeEventListener("abort", restore)
    restores.length = 0
    signals.length = 0
  }

  return restore
}
