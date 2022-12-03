// @src https://bugzilla.mozilla.org/show_bug.cgi?id=505521#c87
// patch for Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=505521

let cx
let cy
let px
let py
let ox
let oy
let sx
let sy
let lx
let ly

function update(e) {
  cx = e.clientX
  cy = e.clientY
  px = e.pageX
  py = e.pageY
  ox = e.offsetX
  oy = e.offsetY
  sx = e.screenX
  sy = e.screenY
  lx = e.layerX
  ly = e.layerY
}

function assign(e) {
  e.__cx = cx
  e.__cy = cy
  e.__px = px
  e.__py = py
  e.__ox = ox
  e.__oy = oy
  e.__sx = sx
  e.__sy = sy
  e.__lx = lx
  e.__ly = ly
}

window.addEventListener("mousemove", update, true)
window.addEventListener("dragover", update, true)
// bug #505521 identifies these three listeners as problematic:
// (although tests show 'dragstart' seems to work now, keep to be compatible)
window.addEventListener("dragstart", assign, true)
window.addEventListener("drag", assign, true)
window.addEventListener("dragend", assign, true)

const me = Object.getOwnPropertyDescriptors(window.MouseEvent.prototype)
const ue = Object.getOwnPropertyDescriptors(window.UIEvent.prototype)

function getter(prop, repl) {
  return function () {
    return (me[prop] && me[prop].get.call(this)) || Number(this[repl]) || 0
  }
}

function layerGetter(prop, repl) {
  return function () {
    return this.type === "dragover" && ue[prop]
      ? ue[prop].get.call(this)
      : Number(this[repl]) || 0
  }
}

Object.defineProperties(window.DragEvent.prototype, {
  clientX: { get: getter("clientX", "__cx") },
  clientY: { get: getter("clientY", "__cy") },
  pageX: { get: getter("pageX", "__px") },
  pageY: { get: getter("pageY", "__py") },
  offsetX: { get: getter("offsetX", "__ox") },
  offsetY: { get: getter("offsetY", "__oy") },
  screenX: { get: getter("screenX", "__sx") },
  screenY: { get: getter("screenY", "__sy") },
  x: { get: getter("x", "__cx") },
  y: { get: getter("y", "__cy") },
  layerX: { get: layerGetter("layerX", "__lx") },
  layerY: { get: layerGetter("layerY", "__ly") },
})
