import arrify from "../fabric/type/any/arrify.js"

function registerRenderer(stage, scope, renderer) {
  stage.renderers[scope] ??= new Set()
  stage.renderers[scope].add(renderer)
}

export default function register(stage, loc, fn) {
  let scopes
  let renderer // TODO: check renderer garbage collection

  if (typeof loc === "function") {
    scopes = loc.scopes
    renderer = async (changed) => {
      stage.waitlistPending.push(
        loc(stage.reactive.state).then((val) => fn(val, changed))
      )
    }
  } else {
    scopes = arrify(loc)

    renderer = async (changed) => {
      const res = fn(stage.reactive.get(scopes[0]), changed)
      if (res !== undefined) stage.waitlistPending.push(res)
    }
  }

  for (const scope of scopes) {
    registerRenderer(stage, scope, renderer)
  }

  renderer()

  const forget = () => {
    for (const scope of scopes) {
      if (stage.renderers[scope]) {
        stage.renderers[scope].delete(renderer)
        if (stage.renderers[scope].size === 0) delete stage.renderers[scope]
      }
    }
  }

  stage.cancel.signal.addEventListener("abort", forget)

  return forget
}

register.registerRenderer = registerRenderer
