import chainable from "../../fabric/traits/chainable.js"
import simulate from "../../fabric/event/simulate.js"
import waitFor from "../../fabric/dom/waitFor.js"
import mark from "../../fabric/type/any/mark.js"
import sleep from "../../fabric/type/promise/sleep.js"
import when from "../../fabric/type/promise/when.js"
import DOMQuery from "../../fabric/class/DOMQuery.js"

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

function changeFocus(target) {
  if (!target.ownerDocument.hasFocus()) target.ownerDocument.focus()
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

const puppet = chainable(
  {
    order: [],
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
        data.pendingKeys.set(mark(init), () => simulate(target, "keyup", init))
        simulate(target, "keydown", init)
      })
    },

    keyup({ data }, init) {
      data.order.push(async (target) => {
        autoCleanup(data)
        simulate(target, "keydown", init)
        data.pendingKeys.delete(mark(init))
      })
    },

    keystroke({ data }, init) {
      data.order.push(async (target) => {
        autoCleanup(data)
        data.pendingKeys.set(mark(init), () => simulate(target, "keyup", init))
        simulate(target, "keydown", init)
        await sleep(0)

        simulate(target, "keyup", init)
        data.pendingKeys.delete(mark(init))
        await sleep(0)
      })
    },

    select({ data }) {
      data.order.push(async (target) => target.select?.())
    },

    focus({ data }) {
      data.order.push(async (target) => {
        if ("focus" in target) target.focus()
        else simulate(target, "focus")
      })
    },

    blur({ data }) {
      data.order.push(async (target) => {
        if ("blur" in target) target.blur()
        else simulate(target, "blur")
      })
    },

    dbclick({ data }) {
      data.order.push(async (target) => simulate(target, "dbclick"))
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

    when({ data }, events, options) {
      data.order.push(async (target) => when(target, events, options))
    },

    target({ data }, target, options) {
      data.order.push({ target, options })
    },

    async then({ data }, resolve, reject) {
      data.targets = [globalThis]

      for (const item of data.order) {
        if (typeof item === "function") {
          await Promise.all(data.targets.map((target) => item(target)))
        } else if ("target" in item) {
          data.targets = item.target
          if (typeof data.targets === "string") {
            try {
              data.targets = await waitFor(data.targets, {
                ...item.options,
                all: true,
              })
            } catch (err) {
              reject(err)
              return
            }
          }
        }
      }

      setTimeout(() => {
        for (const keyup of data.pendingKeys.values()) keyup()
      }, 0)

      resolve()
    },
  },

  function ({ data }, target, options) {
    data.order.push({ target, options })
    return this
  }
)

puppet.cleanup = cleanup
puppet.$ = new DOMQuery()

export default puppet
