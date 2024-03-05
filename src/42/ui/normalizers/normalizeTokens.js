import resolveScope from "../utils/resolveScope.js"
import findScope from "../utils/findScope.js"
import filters from "../../core/filters.js"
import allocate from "../../fabric/locator/allocate.js"
import dispatch from "../../fabric/event/dispatch.js"
import isPromiseLike from "../../fabric/type/any/is/isPromiseLike.js"
import segmentize from "../../fabric/type/string/segmentize.js"
import { findComponentAction, delimiter } from "../normalize.js"

function makeActionAsyncFn(fn, thisArg, el) {
  async function action(...args) {
    try {
      if (thisArg === undefined) return await fn(...args)
      return await fn.call(thisArg, ...args)
    } catch (err) {
      dispatch(el, err)
    }
  }

  action.originalFn = fn
  return action
}

function makeActionFn(fn, thisArg, el) {
  function action(...args) {
    try {
      if (thisArg === undefined) return fn(...args)
      return fn.call(thisArg, ...args)
    } catch (err) {
      dispatch(el, err)
    }
  }

  action.originalFn = fn
  return action
}

export function normalizeTokens(tokens, stage, options) {
  let hasFilter = false
  const scopes = []
  const actions = options?.actions ?? { ...stage.actions.value }

  const makeAction = options?.async === false ? makeActionFn : makeActionAsyncFn

  for (const token of tokens) {
    if (token.value === undefined) continue

    let loc

    if (options?.specials) {
      const segment = segmentize(token.value, [".", "/"])[0]
      loc = options.specials.includes(segment)
        ? resolveScope(stage.scope, token.value)
        : resolveScope(...findScope(stage, token.value), stage)
    } else {
      loc = resolveScope(...findScope(stage, token.value), stage)
    }

    if (token.type === "key") {
      token.value = loc
      scopes.push(token.value)
    } else if (token.type === "function") {
      hasFilter = true

      let action
      let thisArg

      if (stage.component) {
        const res = findComponentAction(stage, stage.component, token.value)
        if (res) {
          thisArg = res[0]
          action = res[1]
        }
      }

      const scope = stage.scope === "/" ? "" : stage.scope
      if (!action && stage.actions.has(scope + loc)) {
        thisArg = stage
        action = stage.actions.get(scope + loc)
      }

      if (!action && stage.actions.has(loc)) {
        thisArg = stage
        action = stage.actions.get(loc)
      }

      let fn

      if (typeof action === "function") {
        fn = makeAction(action, thisArg, stage.el)
      } else {
        const thisArg = stage
        const { value } = token
        const err = new TypeError(
          `Template filter is not a function: "${value}"`,
        )

        if (isPromiseLike(action)) {
          fn = action.then((res) => {
            if (Array.isArray(res)) {
              const [thisArg, action] = res
              return makeAction(action, thisArg, stage.el)
            }

            return void dispatch(stage.el, err)
          })
        } else {
          fn = filters(value).then((filter) => {
            if (typeof filter !== "function") {
              return void dispatch(stage.el, err)
            }

            return makeAction(filter, thisArg, stage.el)
          })
        }
      }

      allocate(actions, loc, fn, delimiter)

      token.value = loc
    }
  }

  const locals = options?.locals ?? {}

  // queueMicrotask(() => {
  //   if (locals.this) return
  //   // TODO: check possible xss vector attack
  //   locals.this = stage.el
  // })
  // locals.this = {
  //   get value() {
  //     return stage.el.value
  //   },
  //   get textContent() {
  //     return stage.el.textContent
  //   },
  //   get rect() {
  //     return stage.el.getBoundingCLientRect()
  //   },
  // }
  return { hasFilter, scopes, actions, locals }
}

export default normalizeTokens
