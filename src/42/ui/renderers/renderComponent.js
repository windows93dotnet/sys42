import defer from "../../fabric/type/promise/defer.js"

export default function renderComponent(el, def, ctx) {
  const deferred = defer()
  ctx.components.push(deferred)
  const tag = el.localName

  if (customElements.get(tag) === undefined) {
    el.toggleAttribute("data-no-init", true)

    const module = tag.slice(3)
    if (!module.startsWith("t-")) {
      import(`../components/${module}.js`).catch(() => {
        deferred.reject(new Error(`Unknown component: ${tag}`))
      })
    }

    customElements
      .whenDefined(tag)
      .then(() => {
        customElements.upgrade(el)
        return el.init(def, ctx)
      })
      .then(deferred.resolve)
      .catch(deferred.reject)
  } else {
    el.init(def, ctx) //
      .then(deferred.resolve)
      .catch(deferred.reject)
  }

  return el
}
