import renderTooltip from "./renderTooltip.js"
import defer from "../../fabric/type/promise/defer.js"
import { addEntry } from "../normalize.js"

export default function renderComponent(el, plan, stage, options) {
  const deferred = defer()
  stage?.waitlistComponents.push(deferred)
  const tag = el.localName

  if (plan.entry) addEntry(stage.component, plan.entry, el)
  if (plan.tooltip) renderTooltip(el, plan.tooltip, stage)

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
      el.init(plan, stage, options).then(deferred.resolve, deferred.reject)
    })
  } else {
    el.init(plan, stage, options).then(deferred.resolve, deferred.reject)
  }

  return el
}
