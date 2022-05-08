import defer from "../../fabric/type/promise/defer.js"
import parseAbbreviation from "../utils/parseAbbreviation.js"

export default function renderComponent(type, def, ctx) {
  const parsed = parseAbbreviation(type, def)

  const el = document.createElement(parsed.tag)
  el.setAttribute("data-lazy-init", "true")
  const tag = el.localName

  const deferred = defer()
  ctx.undones.push(deferred)

  if (el.constructor === HTMLElement) {
    const stem = tag.slice(3)
    if (!stem.startsWith("t-")) {
      import(`../components/${stem}.js`).catch(() => {
        deferred.reject(new Error(`Unknown component: ${tag}`))
      })
    }

    customElements
      .whenDefined(tag)
      .then(() => {
        customElements.upgrade(el)
        el.init(def, ctx).then(() => deferred.resolve())
      })
      .catch((err) => deferred.reject(err))
  } else {
    queueMicrotask(() => el.init(def, ctx).then(() => deferred.resolve()))
  }

  return el
}
