import Loop from "../fabric/classes/Loop.js"

if ("requestIdleCallback" in globalThis === false) {
  await import("./env/polyfills/globalThis.requestIdleCallback.js")
}

export class Mainloop extends Loop {
  constructor() {
    const registry = new Map()
    super((delta) => registry.forEach((fn) => fn(delta)))
    this.registry = registry
    globalThis.requestIdleCallback(() => this.play(), { timeout: 500 })
  }

  add(name, fn) {
    if (fn === undefined) {
      fn = name
      name = fn.name || String(this.registry.size)
    }

    this.registry.set(name, fn)
    return this
  }

  delete(name) {
    return this.registry.delete(name)
  }
}

export default new Mainloop()
