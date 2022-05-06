import create from "../create.js"

export default function renderComponent(type, def, ctx) {
  const el = create(type)
  el.setAttribute("data-lazy-init", "true")
  const tag = el.localName

  ctx.undones.push(el.ready)

  if (el.constructor === HTMLElement) {
    import(`../components/${tag.slice(3)}.js`).catch(() => {
      el.ready.reject(new Error(`Unknown component: ${tag}`))
    })

    customElements
      .whenDefined(tag)
      .then(() => {
        customElements.upgrade(el)
        el.init(def, ctx)
      })
      .catch((err) => el.ready.reject(err))
  } else {
    queueMicrotask(() => el.init(def, ctx))
  }

  return el
}
