import ipc from "../ipc.js"
import uid from "../uid.js"
import inTop from "../env/realm/inTop.js"
import toKebabCase from "../../fabric/type/string/case/toKebabCase.js"
import ALLOWED_HTML_ATTRIBUTES from "../../fabric/constants/ALLOWED_HTML_ATTRIBUTES.js"
import SecurityError from "../../fabric/errors/SecurityError.js"
import Canceller from "../../fabric/classes/Canceller.js"
import untilElementRemove from "../../fabric/dom/untilElementRemove.js"
import { serialize, deserialize } from "./transmit.js"

const _isComponent = Symbol.for("Component.isComponent")
const _REMOTE_EXPORT = Symbol.for("ElementController.REMOTE_EXPORT")
const _EVENTS = Symbol.for("Emitter.EVENTS")

const EMITTER_METHODS = new Set(["on", "off", "once", "emit", "send"])

const IGNORE_METHODS = {
  element: new Set(["constructor"]),
  component: new Set(["constructor", "render", "setup"]),
}

const ELEMENT_METHODS = new Set()
{
  let div = document.createElement("div")

  for (const key in div) {
    if (
      !key.startsWith("onmozfullscreen") && // prevent firefox warning
      typeof div[key] === "function"
    ) {
      ELEMENT_METHODS.add(key)
    }
  }

  div = undefined
}

class ExtendableProxy {
  constructor(handler) {
    // eslint-disable-next-line no-constructor-return
    return new Proxy(this, handler)
  }
}

export let ElementController

function makeRemote(el) {
  const isComponent = el[_isComponent]

  const ALLOWED_PROPS = isComponent
    ? Object.keys(el.constructor.plan.props)
    : []

  const methods = new Set(isComponent ? ["destroy"] : [])

  if (el[_EVENTS]) {
    for (const item of EMITTER_METHODS) methods.add(item)
  }

  const ignore = IGNORE_METHODS[isComponent ? "component" : "element"]

  const descriptors = Object.getOwnPropertyDescriptors(el.constructor.prototype)
  for (const key in descriptors) {
    if (
      Object.hasOwn(descriptors, key) &&
      typeof key === "string" &&
      typeof descriptors[key].value === "function" &&
      !ignore.has(key)
    ) {
      methods.add(key)
    }
  }

  const { cancel, signal } = new Canceller()
  untilElementRemove(el).then(() => {
    requestIdleCallback(() => cancel())
  })

  const ELEMENT_CONTROLLER_ID = `42_ELEMENT_CONTROLLER_${el.id}`

  ipc.on(ELEMENT_CONTROLLER_ID, { signal }, async ({ get, set, call }) => {
    if (get) {
      return Reflect.get(el, get)
    }

    if (set) {
      let [prop, value] = set
      value = deserialize(value, { signal })

      if (
        !(
          ALLOWED_PROPS.includes(prop) ||
          ALLOWED_HTML_ATTRIBUTES.includes(prop) ||
          ALLOWED_HTML_ATTRIBUTES.includes(toKebabCase(prop))
        )
      ) {
        throw new SecurityError(`Unallowed attribute: ${prop}`)
      }

      Reflect.set(el, prop, value)
    }

    if (call) {
      const args = deserialize(call.args, { signal })
      const res = await el[call.method](...args)
      if (res === el) return ELEMENT_CONTROLLER_ID
      return res
    }
  })

  return {
    id: el.id,
    methods,
  }
}

if (inTop) {
  ElementController = class extends ExtendableProxy {
    static REMOTE_EXPORT = _REMOTE_EXPORT

    constructor(el) {
      el.id ||= uid()

      super({
        get(target, prop) {
          if (typeof el[prop] === "function") {
            return async (...args) => el[prop](...args)
          }

          if (prop === "el") return el

          if (prop === _REMOTE_EXPORT) return makeRemote(el)

          // Make value reading async to be consistant
          // with ElementController in sandboxed iframes
          return Promise.resolve(Reflect.get(el, prop))
        },

        set(target, prop, value) {
          return Reflect.set(el, prop, value)
        },
      })
    }
  }
} else {
  ElementController = class extends ExtendableProxy {
    constructor({ id, methods }) {
      const ELEMENT_CONTROLLER_ID = `42_ELEMENT_CONTROLLER_${id}`

      super({
        get(target, prop) {
          if (prop === "el") {
            throw new Error(
              "ElementController.el is not accessible from an iframe",
            )
          }

          if (ELEMENT_METHODS.has(prop) || methods.has(prop)) {
            return async (...args) => {
              const res = await ipc.send(ELEMENT_CONTROLLER_ID, {
                call: {
                  method: prop,
                  args: serialize(args),
                },
              })
              if (res === ELEMENT_CONTROLLER_ID) return target
              return res
            }
          }

          // when called with `await`
          if (prop === "then") return

          return ipc.send(ELEMENT_CONTROLLER_ID, { get: prop })
        },

        set(target, prop, value) {
          ipc.emit(ELEMENT_CONTROLLER_ID, { set: [prop, value] })
          return true
        },
      })
    }
  }
}

export default ElementController
