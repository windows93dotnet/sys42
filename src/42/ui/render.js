/* eslint-disable complexity */
import create from "./create.js"
import register from "./register.js"
import normalize from "./normalize.js"
import renderComponent from "./renderers/renderComponent.js"
import renderIf from "./renderers/renderIf.js"
import renderEach from "./renderers/renderEach.js"
import renderOn from "./renderers/renderOn.js"
import renderAnimation from "./renderers/renderAnimation.js"
// import { animateTo, animateFrom } from "../fabric/dom/animate.js"
import renderTag from "./renderers/renderTag.js"
import isPromiseLike from "../fabric/type/any/is/isPromiseLike.js"

const { ELEMENT_NODE } = Node

const makeBr = () => document.createElement("br")
const makeHr = () => document.createElement("hr")
const SPECIAL_STRINGS = {
  "\n\n": makeBr,
  "<br>": makeBr,
  "---": makeHr,
  "<hr>": makeHr,
}

export default function render(plan, stage, options) {
  if (stage?.pluginHandlers) {
    for (const pluginHandle of stage.pluginHandlers) {
      const res = pluginHandle(plan, stage, options)
      // if (res !== undefined) return res
      if (res !== undefined) plan = res
    }
  }

  if (!options?.skipNormalize) {
    const normalized = normalize(plan, stage, options)
    plan = normalized[0]
    stage = normalized[1]
  }

  if (options?.ignoreScopeResolver !== true) {
    let state =
      stage.scopeResolvers[stage.scope] ?? stage.reactive.get(stage.scope)

    let resolver

    if (typeof state === "function") {
      resolver = state
      state = state(stage)
    }

    if (isPromiseLike(state)) {
      const loader = document.createElement("div")
      loader.setAttribute("aria-label", "loading")
      loader.className = "loader"

      stage.el?.setAttribute("aria-busy", "true")

      state.then((res) => {
        delete stage.scopeResolvers[stage.scope]
        stage.reactive.set(stage.scope, res, { silent: true })
        stage.el?.setAttribute("aria-busy", "false")
        const el = render(plan, stage, {
          ...options,
          skipNormalize: true,
          ignoreScopeResolver: true,
        })
        loader.replaceWith(el)
        stage.scopeResolvers[stage.scope] = resolver
      })

      return loader
    }

    if (resolver) stage.reactive.set(stage.scope, state, { silent: true })
  }

  if (plan.if) return renderIf(plan, stage)
  if (plan.each) return renderEach(plan, stage)

  if (plan?.tag?.startsWith("ui-")) {
    // TODO: rewrite normalize using parseTagSelector
    // to fix tags like "div > ui-foo" and skip traits and attrs normalization
    delete plan.setTraits
    delete plan.attrs

    if (options?.step !== undefined) {
      stage = stage.fork({ steps: `${stage.steps},${options.step}` })
    }

    return renderComponent(create(plan.tag), plan, stage, options)
  }

  if (options?.step !== undefined) stage.steps += "," + options.step

  switch (stage.type) {
    case "string":
      return SPECIAL_STRINGS[plan]?.() ?? document.createTextNode(plan)

    case "array": {
      stage.parent = stage.el
      const fragment = document.createDocumentFragment()
      for (let step = 0, l = plan.length; step < l; step++) {
        stage.type = typeof plan[step]
        fragment.append(render(plan[step], stage, { step }))
      }

      return fragment
    }

    case "function": {
      let el = document.createTextNode("")
      register(stage, plan, (val) => {
        if (stage.pluginHandlers.length > 0) {
          for (const pluginHandle of stage.pluginHandlers) {
            const res = pluginHandle(val, stage, options)
            if (res !== undefined) val = res
          }

          if (val !== undefined && typeof val !== "string") {
            const res = render(val, stage, options)
            el.replaceWith(res)
            el = res
            return
          }
        }

        el.textContent = val
      })
      return el
    }

    default:
  }

  let el
  let container

  if (plan.tag || plan.attrs) {
    if (plan.tag) {
      const nesteds = plan.tag.split(/\s*>\s*/)
      for (let i = 0, l = nesteds.length; i < l; i++) {
        const tag = nesteds[i]
        const cur = i === l - 1 ? renderTag(tag, plan, stage) : create(tag)
        if (el) {
          stage.parent = el
          el.append(cur)
        } else {
          stage.parent = cur
          container = cur
        }

        el = cur
      }
    } else {
      stage.parent = stage.el
      el = renderTag(plan.tag, plan, stage)
    }
  } else {
    el = document.createDocumentFragment()
  }

  if (plan.picto?.start) {
    el.append(
      renderComponent(create("ui-picto"), { value: plan.picto.start }, stage),
    )
  }

  if (plan.content !== undefined) {
    if (plan.content instanceof Node) el.append(plan.content)
    else {
      el.append(
        render(plan.content, stage, {
          step:
            el.nodeType === ELEMENT_NODE
              ? el.localName + (el.id ? `#${el.id}` : "")
              : undefined,
        }),
      )
    }
  }

  if (plan.picto?.end) {
    el.append(
      renderComponent(create("ui-picto"), { value: plan.picto.end }, stage),
    )
  }

  if (plan.setTraits) stage.waitlistTraits.push(plan.setTraits(stage.el))

  if (plan.on) renderOn(stage.el, plan, stage)

  if (plan.animate?.from) {
    renderAnimation(stage, stage.el, "from", plan.animate.from)
  }

  return container ?? el
}
