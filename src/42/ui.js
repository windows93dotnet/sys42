import render from "./ui/render.js"
// import noop from "./type/function/noop.js"
// import compositor from "./ui/compositor.js"

import UI from "./ui/class/UI.js"

export default async function ui(...args) {
  return new UI(...args).mount()
}

ui.trusted = (...args) => new UI(...args).mount(undefined, { trusted: true })

ui.make = (...args) => new UI(...args)

// ui.noop = noop

// ui.compositor = compositor
ui.render = render
