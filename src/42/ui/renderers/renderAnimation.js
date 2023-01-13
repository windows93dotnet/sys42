import animate from "../../fabric/dom/animate.js"
import setTemp from "../../fabric/dom/setTemp.js"

function start(el, how, options) {
  const temp = { class: { "action-0": true } }
  if ("x" in el && "y" in el) {
    temp.style = {
      transformOrigin: `calc(${el.x}px + 50%) calc(${el.y}px + 50%)`,
    }
  }

  const restore = setTemp(el, temp)
  return animate[how](el, options).then(restore)
}

export default async function renderAnimation(stage, el, how, options) {
  if (options.initial === false) {
    delete options.initial
    return
  }

  await 0 // queueMicrotask

  if (how === "from" && !el.isConnected) {
    stage.postrender.push(() => start(el, how, options))
    return
  }

  return start(el, how, options)
}
