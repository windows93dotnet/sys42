import ipc from "../ipc.js"
import uid from "../uid.js"
import inTop from "../env/realm/inTop.js"
import toKebabCase from "../../fabric/type/string/case/toKebabCase.js"
import ALLOWED_HTML_ATTRIBUTES from "../../fabric/constants/ALLOWED_HTML_ATTRIBUTES.js"
import SecurityError from "../../fabric/errors/SecurityError.js"
import Canceller from "../../fabric/classes/Canceller.js"
import untilElementRemove from "../../fabric/dom/untilElementRemove.js"

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
    if (typeof div[key] === "function") ELEMENT_METHODS.add(key)
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

          if (prop === _REMOTE_EXPORT) {
            const isComponent = el[_isComponent]

            const ALLOWED_PROPS = isComponent
              ? Object.keys(el.constructor.plan.props)
              : []

            const methods = new Set(isComponent ? ["destroy"] : [])

            if (el[_EVENTS]) {
              for (const item of EMITTER_METHODS) methods.add(item)
            }

            const ignore = IGNORE_METHODS[isComponent ? "component" : "element"]

            const descriptors = Object.getOwnPropertyDescriptors(
              el.constructor.prototype,
            )
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
            untilElementRemove(el).then(cancel)

            ipc.on(
              `42_ELEMENT_CONTROLLER_${el.id}`,
              { signal },
              ({ get, set, call }) => {
                if (get) {
                  return Reflect.get(el, get)
                }

                if (set) {
                  const [prop, value] = set
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
                  return el[call.method](...call.args)
                }
              },
            )

            return {
              id: el.id,
              methods,
            }
          }

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
      id = `42_ELEMENT_CONTROLLER_${id}`

      super({
        get(target, prop) {
          if (prop === "el") {
            throw new Error(
              "ElementController.el is not accessible from an iframe",
            )
          }

          if (ELEMENT_METHODS.has(prop) || methods.has(prop)) {
            return (...args) => ipc.send(id, { call: { method: prop, args } })
          }

          if (prop === "then") return

          return ipc.send(id, { get: prop })
        },
        set(target, prop, value) {
          ipc.emit(id, { set: [prop, value] })
          return true
        },
      })
    }
  }
}

export default ElementController
