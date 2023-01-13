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

export default async function renderAnimation(ctx, el, how, def) {
  if (def.initial === false) {
    delete def.initial
    return
  }

  await 0 // queueMicrotask

  if (how === "from" && !el.isConnected) {
    ctx.postrender.push(() => start(el, how, def))
    return
  }

  return start(el, how, def)
}
