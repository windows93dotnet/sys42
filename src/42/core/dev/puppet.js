import chainable from "../../fabric/traits/chainable.js"
import simulate from "../../fabric/event/simulate.js"
import waitFor from "../../fabric/dom/waitFor.js"
import mark from "../../fabric/type/any/mark.js"
import sleep from "../../fabric/type/promise/sleep.js"
import when from "../../fabric/type/promise/when.js"
import arrify from "../../fabric/type/any/arrify.js"
import DOMQuery from "../../fabric/class/DOMQuery.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import nextCycle from "../../fabric/type/promise/nextCycle.js"

const clickOrder = [
  "pointerdown",
  "mousedown",
  "focus",
  "pointerup",
  "mouseup",
  "click",
]

const tapOrder = [
  "pointerdown",
  "touchstart",
  "pointerup",
  "touchend",
  "mousedown",
  "focus",
  "mouseup",
  "click",
]

const $ = new DOMQuery()

function changeFocus(target) {
  const doc = target.ownerDocument ?? target.document ?? globalThis.document
  if (!doc.hasFocus()) doc.defaultView.focus()
}

const allPendingKeys = new Set()
let timeoutId

function cleanup() {
  for (const pendingKeys of allPendingKeys) {
    for (const keyup of pendingKeys.values()) keyup()
  }
}

function autoCleanup({ pendingKeys }) {
  allPendingKeys.add(pendingKeys)
  clearTimeout(timeoutId)
  timeoutId = setTimeout(() => cleanup(), 3000)
}

const makePuppet = () => {
  const instance = chainable(
    {
      order: [],
      whens: [],
      pendingKeys: new Map(),

      click({ data }) {
        data.order.push(changeFocus)
        for (const event of clickOrder) {
          data.order.push(async (target) => simulate(target, event))
        }
      },

      tap({ data }) {
        data.order.push(changeFocus)
        for (const event of tapOrder) {
          data.order.push(async (target) => simulate(target, event))
        }
      },

      keydown({ data }, init) {
        data.order.push(async (target) => {
          autoCleanup(data)
          data.pendingKeys.set(mark(init), () =>
            simulate(target, "keyup", init)
          )
          simulate(target, "keydown", init)
        })
      },

      keyup({ data }, init) {
        data.order.push(
          init === undefined
            ? async () => {
                for (const keyup of data.pendingKeys.values()) keyup()
              }
            : async (target) => {
                autoCleanup(data)
                simulate(target, "keydown", init)
                data.pendingKeys.delete(mark(init))
              }
        )
      },

      keystroke({ data }, init) {
        data.order.push(async (target) => {
          autoCleanup(data)
          data.pendingKeys.set(mark(init), () =>
            simulate(target, "keyup", init)
          )
          simulate(target, "keydown", init)
          await nextCycle()

          simulate(target, "keyup", init)
          data.pendingKeys.delete(mark(init))
          await nextCycle()
        })
      },

      select({ data }) {
        data.order.push(async (target) => target.select?.())
      },

      focus({ data }) {
        data.order.push(async (target) => {
          simulate(target, "focus")
        })
      },

      blur({ data }) {
        data.order.push(async (target) => {
          simulate(target, "blur")
        })
      },

      dblclick({ data }) {
        data.order.push(async (target) => simulate(target, "dblclick"))
      },

      contextmenu({ data }) {
        data.order.push(async (target) => simulate(target, "contextmenu"))
      },

      fill({ data }, val) {
        data.order.push(async (target) => {
          if (val !== undefined && "value" in target) target.value = val
          simulate(target, "input")
          simulate(target, "change")
        })
      },

      input({ data }, val) {
        data.order.push(async (target) => {
          if (val !== undefined && "value" in target) target.value = val
          simulate(target, "input")
        })
      },

      dispatch({ data }, event, init) {
        data.order.push(async (target) => simulate(target, event, init))
      },

      simulate(ctx, target, event, init) {
        simulate(target, event, init)
      },

      when({ data }, ...args) {
        data.whens.push(() => when(...args))
      },

      sleep({ data }, ms) {
        data.order.push(async (target) => sleep(target, ms))
      },

      nextCycle({ data }, ms) {
        data.order.push(async (target) => nextCycle(target, ms))
      },

      target({ data }, target, options) {
        data.order.push({ target, options })
      },

      cleanup({ data }) {
        for (const keyup of data.pendingKeys.values()) keyup()
      },

      async then({ data }, resolve, reject) {
        data.targets = [globalThis]

        const undones = []

        for (const item of data.order) {
          if (typeof item === "function") {
            undones.push(...data.targets.map((target) => item(target)))
          } else if ("target" in item) {
            if (typeof item.target === "string") {
              try {
                data.targets = await waitFor(item.target, {
                  ...item.options,
                  all: true,
                })
              } catch (err) {
                reject(err)
                return
              }
            } else {
              data.targets = arrify(item.target)
            }
          }
        }

        await (data.whens
          ? Promise.all(data.whens.map((x) => x()))
          : Promise.all(undones))

        data.whens.length = 0
        data.order.length = 0
        undones.length = 0
        delete data._stack

        queueTask(() => {
          for (const keyup of data.pendingKeys.values()) keyup()
          resolve([...data.targets])
          data.targets.length = 0
        })
      },
    },

    function ({ data }, target, options) {
      data.order.push({ target, options })
      return this
    }
  )

  instance.$ = $
  instance.makePuppet = makePuppet

  return instance
}

const puppet = makePuppet()

export default puppet
