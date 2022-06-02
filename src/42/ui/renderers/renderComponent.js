import defer from "../../fabric/type/promise/defer.js"

export default function renderComponent(el, def, ctx) {
  const deferred = defer()
  ctx.undones.push(deferred)
  const tag = el.localName

  if (el.constructor === HTMLElement) {
    const module = tag.slice(3)
    import(`../components/${module}.js`).catch(() => {
      deferred.reject(new Error(`Unknown component: ${tag}`))
    })

    customElements
      .whenDefined(tag)
      .then(() => {
        customElements.upgrade(el)
        el.init(def, ctx).then(() => deferred.resolve())
      })
      .catch((err) => deferred.reject(err))
  } else {
    el.init(def, ctx).then(() => deferred.resolve())
  }

  return el
}
