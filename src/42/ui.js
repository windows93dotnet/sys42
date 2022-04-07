import render from "./ui/render.js"
import layerManager from "./ui/layerManager.js"
import UI from "./ui/class/UI.js"

export default async function ui(...args) {
  return new UI(...args).mount()
}

ui.trusted = (...args) => new UI(...args).mount(undefined, { trusted: true })
ui.make = (...args) => new UI(...args)

ui.layerManager = layerManager
ui.render = render
