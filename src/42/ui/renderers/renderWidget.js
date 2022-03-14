import defer from "../../fabric/type/promise/defer.js"

export default function renderWidget(type, def, ctx) {
  const el = document.createElement(type)
  el.setAttribute("data-lazy-init", "true")
  const deferred = defer()

  ctx.undones.push(deferred)

  const initWidget = () => {
    ctx.undones = undefined
    el.$init(def, ctx)
    ctx.undones.then((x) => deferred.resolve([`widget ${type}`, ...x]))
  }

  if (el.constructor === HTMLElement) {
    import(`../../widgets/${type.slice(3)}.js`).catch(() => {
      deferred.reject(new Error(`Unknown widget: ${type}`))
    })

    customElements
      .whenDefined(type)
      .then(() => {
        customElements.upgrade(el)
        initWidget()
      })
      .catch((err) => deferred.reject(err))
  } else {
    queueMicrotask(initWidget)
  }

  return el
}
