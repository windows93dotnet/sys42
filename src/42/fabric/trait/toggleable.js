class Toggler {
  constructor(enabled = true) {
    Object.defineProperty(this, Toggler.ENABLED, {
      value: enabled,
      writable: true,
    })
  }

  get enabled() {
    return this[Toggler.ENABLED]
  }

  set enabled(value) {
    value = Boolean(value)
    if (value === this[Toggler.ENABLED]) return
    this[Toggler.ENABLED] = value
    this.emit?.(value ? "enable" : "disable")
  }

  enable() {
    this.enabled = true
    return this
  }

  disable() {
    this.enabled = false
    return this
  }

  toggle(force) {
    this.enabled = force === undefined ? !this[Toggler.ENABLED] : Boolean(force)
    return this
  }
}

export default function toggleable(item, enabled = true) {
  if (!item) return new Toggler(enabled)

  Object.defineProperty(item, Toggler.ENABLED, {
    value: enabled,
    writable: true,
  })
  const descriptors = Object.getOwnPropertyDescriptors(Toggler.prototype)
  for (const key in descriptors) {
    if (key !== "constructor" && key in item === false) {
      Object.defineProperty(item, key, descriptors[key])
    }
  }

  return item
}

Toggler.ENABLED = Symbol("Toggler.ENABLED")
toggleable.ENABLED = Toggler.ENABLED
