import inTop from "../../../env/realm/inTop.js"
import trap from "../../../../fabric/type/error/trap.js"
import debounce from "../../../../fabric/type/function/debounce.js"
import isInstanceOf from "../../../../fabric/type/any/is/isInstanceOf.js"
import unsee from "../../../../fabric/dom/unsee.js"

import makeRealmLab from "./makeRealmLab.js"
import triggerOpener from "./triggerOpener.js"
import untilClose from "./untilClose.js"

// UI tests self-execute if not started from a test runner.
// It allow to manually debug GUI tests inside a webpage
// because the last executed test will not destroy GUI using t.utils.decay()

let total = 0
let index = 0

const selfExecute = debounce(async (sbs) => {
  sbs.started = true
  document.documentElement.classList.add("debug")

  for (const suite of sbs.root.suites) {
    if (suite.onlies.size > 0) {
      total += suite.onlies.size
    } else {
      for (const test of suite.tests) {
        if (test.skip === false) total++
      }
    }
  }

  await sbs.run()
  sbs.report(await sbs.serialize(), { verbose: 3 })

  // listen to errors for further manual testing
  sbs.manual = true
  trap()
}, 1)

async function untilIframesReady(t, sbs, retries = 300) {
  const iframes = document.querySelectorAll('iframe[src$="test=true"]')

  if (iframes.length > 0) {
    const queue = new Set()
    for (const iframe of iframes) queue.add(iframe.src)

    t.timeout(4500)
    await new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (retries-- < 0) {
          clearInterval(interval)
          reject(new Error(`no tests found in iframe`))
        }

        for (const item of sbs.iframes) if (queue.has(item)) queue.delete(item)

        if (queue.size === 0) {
          clearInterval(interval)
          resolve()
        }
      }, 15)
    })
  }
}

export default function uiTest(fn, sbs) {
  requestIdleCallback(async () => {
    if (!inTop || sbs.started) return
    selfExecute(sbs)
  })

  return async (t) => {
    index++

    t.utils.triggerOpener = async (...args) => triggerOpener(t, ...args)
    t.utils.makeRealmLab = async (...args) => makeRealmLab(t, ...args)
    t.utils.untilClose = async (...args) => untilClose(...args)
    t.utils.closeDialog = async (el, context = window) => {
      context = isInstanceOf(context, Window)
        ? context
        : context?.ownerDocument?.defaultView

      const { opener } = el

      const promise = el.close()
      await (context
        ? t.utils.until(
            context,
            "ui:dialog.after-close",
            ({ detail }) => detail.opener === opener,
          )
        : promise)
    }

    const { dest } = t.utils

    if (inTop) {
      t.utils.on({
        "ui:dialog.open || ui:popup.open"(e, target) {
          t.utils.decay(unsee(target))
        },
      })
    }

    if (!inTop || (!sbs.inTestRunner && index === total)) {
      Object.assign(t.utils, {
        decay: (item) => item,
        dest: (options) => dest({ ...options, keep: true }),
      })
    } else if (!sbs.inTestRunner) {
      Object.assign(t.utils, {
        dest: (options) => dest({ ...options, visible: true }),
      })
    }

    await 0 // queueMicrotask
    await fn(t, t.utils)

    if (sbs.nestedTestsSerial) {
      t.timeout("reset")
      await untilIframesReady(t, sbs)
      t.timeout("reset")
    }
  }
}
