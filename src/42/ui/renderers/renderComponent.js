import defer from "../../fabric/type/promise/defer.js"

export default function renderComponent(el, plan, ctx, options) {
  const deferred = defer()
  ctx?.components.push(deferred)
  const tag = el.localName

  if (customElements.get(tag) === undefined) {
    el.toggleAttribute("data-no-init", true)

    const module = tag.slice(3)
    if (!module.startsWith("t-")) {
      import(`../components/${module}.js`).catch((err) => {
        err.tag = tag
        deferred.reject(err)
      })
    }

    customElements.whenDefined(tag).then(() => {
      customElements.upgrade(el)
      el.init(plan, ctx, options).then(deferred.resolve, deferred.reject)
    })
  } else {
    el.init(plan, ctx, options).then(deferred.resolve, deferred.reject)
  }

  return el
}
