import Loop from "./class/Loop.js"

export class Mainloop extends Loop {
  constructor() {
    const registry = new Map()
    super((delta) => registry.forEach((fn) => fn(delta)))
    this.registry = registry
    this.play()
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
