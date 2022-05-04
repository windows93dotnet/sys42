import defer from "../../fabric/type/promise/defer.js"
import create from "../create.js"

export default function renderComponent(type, def, ctx) {
  const el = create(type)
  el.setAttribute("data-lazy-init", "true")
  const tag = el.localName

  const deferred = defer()
  ctx.undones.push(deferred)

  const initComponent = () => {
    ctx.undones = undefined

    try {
      el.$init(def, ctx)
    } catch (err) {
      deferred.reject(err)
      return
    }

    ctx.undones.then((x) => deferred.resolve([`component ${tag}`, ...x]))
  }

  if (el.constructor === HTMLElement) {
    import(`../components/${tag.slice(3)}.js`).catch((err) => {
      console.log(err)
      deferred.reject(new Error(`Unknown component: ${tag}`))
    })

    customElements
      .whenDefined(tag)
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
