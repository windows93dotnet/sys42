import defer from "../../fabric/type/promise/defer.js"

export default function renderComponent(type, def, ctx) {
  const el = document.createElement(type)
  el.setAttribute("data-lazy-init", "true")
  const deferred = defer()

  ctx.undones.push(deferred)

  const initComponent = () => {
    ctx.undones = undefined
    el.$init(def, ctx)
    ctx.undones.then((x) => deferred.resolve([`component ${type}`, ...x]))
  }

  if (el.constructor === HTMLElement) {
    import(`../components/${type.slice(3)}.js`).catch(() => {
      deferred.reject(new Error(`Unknown component: ${type}`))
    })

    customElements
      .whenDefined(type)
      .then(() => {
        customElements.upgrade(el)
        initComponent()
      })
      .catch((err) => deferred.reject(err))
  } else {
    queueMicrotask(initComponent)
  }

  return el
}
