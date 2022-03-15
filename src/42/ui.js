import render from "./ui/render.js"
// import compositor from "./ui/compositor.js"

import UI from "./ui/class/UI.js"

export default async function ui(...args) {
  return new UI(...args).mount()
}

ui.trusted = (...args) => new UI(...args).mount(undefined, { trusted: true })

ui.make = (...args) => new UI(...args)

// ui.compositor = compositor
ui.render = render
