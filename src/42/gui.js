import UI from "./gui/class/UI.js"

export default async function ui(...args) {
  return new UI(...args).mount()
}

ui.trusted = (...args) => new UI(...args).mount(undefined, { trusted: true })
ui.make = (...args) => new UI(...args)
