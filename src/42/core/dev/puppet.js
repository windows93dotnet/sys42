import chainable from "../../fabric/traits/chainable.js"
import simulate from "../../fabric/event/simulate.js"
import waitFor from "../../fabric/dom/waitFor.js"
import mark from "../../fabric/type/any/mark.js"
import sleep from "../../fabric/type/promise/sleep.js"
import until from "../../fabric/type/promise/until.js"
import arrify from "../../fabric/type/any/arrify.js"
import DOMQuery from "../../fabric/classes/DOMQuery.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import untilNextTask from "../../fabric/type/promise/untilNextTask.js"
import serial from "../../fabric/type/promise/serial.js"

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

const allPendings = new Set()

function cleanup() {
  for (const pending of allPendings) {
    for (const fn of pending.values()) fn()
  }
}

let timeoutId
function autoCleanup({ pendingKeys, pendingEvents }) {
  allPendings.add(pendingKeys)
  allPendings.add(pendingEvents)
  clearTimeout(timeoutId)
  timeoutId = setTimeout(() => cleanup(), 3000)
}

function normalizeKeyInit(init) {
  return typeof init === "string" ? { key: init } : init
}

function setPositions(target, init, options) {
  if (typeof target?.getBoundingClientRect !== "function") {
    return init
  }

  const { x, y, width, height } = target.getBoundingClientRect()
  if (options?.center === false) {
    return {
      clientX: x,
      clientY: y,
      ...init,
    }
  }

  return {
    clientX: x + Math.round(width / 2),
    clientY: y + Math.round(height / 2),
    ...init,
  }
}

const makePuppet = () => {
  const instance = chainable(
    {
      order: [],
      undones: [],
      pendingKeys: new Map(),
      pendingEvents: new Set(),

      click({ data }, init) {
        for (const event of clickOrder) {
          data.order.push(async (target) =>
            simulate(target, event, setPositions(target, init)),
          )
        }
      },

      tap({ data }, init) {
        for (const event of tapOrder) {
          data.order.push(async (target) =>
            simulate(target, event, setPositions(target, init)),
          )
        }
      },

      enter({ data }, init) {
        data.order.push(async (target) => {
          const initBorder = setPositions(target, init, { center: false })
          simulate(target, "pointerover", initBorder)
          simulate(target, "pointerenter", initBorder)
          simulate(target, "mouseover", initBorder)
          simulate(target, "mouseenter", initBorder)
        })
      },

      leave({ data }, init) {
        data.order.push(async (target) => {
          const initBorder = setPositions(target, init, { center: false })
          simulate(target, "pointerleave", initBorder)
          simulate(target, "mouseleave", initBorder)
        })
      },

      move({ data }, init) {
        data.order.push(async (target) => {
          const initBorder = setPositions(target, init, { center: false })
          const initCenter = setPositions(target, init)
          simulate(target, "pointermove", initBorder)
          simulate(target, "mousemove", initBorder)

          simulate(target, "pointermove", initCenter)
          simulate(target, "mousemove", initCenter)
        })
      },

      hover({ data }, init, fn) {
        if (typeof init === "function") {
          fn = init
          init = undefined
        }

        data.order.push(async (target) => {
          const initBorder = setPositions(target, init, { center: false })
          const initCenter = setPositions(target, init)
          autoCleanup(data)
          data.pendingEvents.add(() => {
            simulate(target, "pointermove", initBorder)
            simulate(target, "mousemove", initBorder)

            simulate(target, "pointerleave", initBorder)
            simulate(target, "mouseleave", initBorder)
          })

          simulate(target, "pointerover", initBorder)
          simulate(target, "pointerenter", initBorder)
          simulate(target, "mouseover", initBorder)
          simulate(target, "mouseenter", initBorder)

          simulate(target, "pointermove", initBorder)
          simulate(target, "mousemove", initBorder)

          simulate(target, "pointermove", initCenter)
          simulate(target, "mousemove", initCenter)

          fn?.()
        })
      },

      keydown({ data }, init) {
        init = normalizeKeyInit(init)
        data.order.push(async (target) => {
          autoCleanup(data)
          data.pendingKeys.set(mark(init), () =>
            simulate(target, "keyup", init),
          )
          simulate(target, "keydown", init)
        })
      },

      keyup({ data }, init) {
        init = normalizeKeyInit(init)
        data.order.push(
          init === undefined
            ? async () => {
                for (const keyup of data.pendingKeys.values()) keyup()
              }
            : async (target) => {
                autoCleanup(data)
                simulate(target, "keydown", init)
                data.pendingKeys.delete(mark(init))
              },
        )
      },

      keystroke({ data }, init) {
        init = normalizeKeyInit(init)
        data.order.push(async (target) => {
          autoCleanup(data)
          data.pendingKeys.set(mark(init), () =>
            simulate(target, "keyup", init),
          )
          simulate(target, "keydown", init)
          await untilNextTask()

          simulate(target, "keyup", init)
          data.pendingKeys.delete(mark(init))
          await untilNextTask()
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

      sleep({ data }, ms) {
        data.order.push(async () => sleep(ms))
      },

      until({ data }, ...args) {
        data.undones.push(() => until(...args))
      },

      untilNextTask({ data }) {
        data.order.push(async () => untilNextTask())
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
              let { options } = item

              if (typeof item.options === "string") {
                options = { base: await waitFor(item.options) }
              } else if (
                item.options?.nodeType &&
                item.options?.querySelector
              ) {
                options = { base: item.options }
              }

              if (options?.base?.localName === "iframe") {
                options.base =
                  options.base.contentWindow.document.documentElement
              }

              try {
                data.targets = await waitFor(item.target, {
                  ...options,
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

        await (data.undones
          ? Promise.all(data.undones.map((x) => x()))
          : serial(undones))

        data.undones.length = 0
        data.order.length = 0
        undones.length = 0
        delete data._stack

        for (const fn of data.pendingEvents) fn()
        data.pendingEvents.clear()

        queueTask(() => {
          for (const keyup of data.pendingKeys.values()) keyup()
          resolve([...data.targets])
          data.targets.length = 0
        })
      },
    },

    function ({ data }, target = document.documentElement, options) {
      data.order.push({ target, options })
      return this
    },
  )

  instance.makePuppet = makePuppet

  instance.$ = (...args) => $.query(...args)
  instance.$$ = (...args) => $.queryAll(...args)
  instance.$$$ = (...args) => $.each(...args)

  instance.run = () =>
    new Promise((resolve, reject) => {
      instance.then(resolve, reject)
    })

  return instance
}

const puppet = makePuppet()

export default puppet
