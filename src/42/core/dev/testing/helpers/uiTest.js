import inTop from "../../../env/realm/inTop.js"
import trap from "../../../../fabric/type/error/trap.js"
import debounce from "../../../../fabric/type/function/debounce.js"
import unsee from "../../../../fabric/dom/unsee.js"

import makeRealmLab from "./makeRealmLab.js"
import triggerOpener from "./triggerOpener.js"
import untilClose from "./untilClose.js"

// Integration tests self-execute if not started from a test runner.
// It allow to manually debug GUI tests inside a webpage
// because the last executed test will not decay elements/components

let total = 0
let index = 0

const selfExecute = debounce(async (sbs) => {
  sbs.started = true
  document.body.classList.add("debug")

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

async function whenIframesReady(t, sbs, retries = 300) {
  const iframes = document.querySelectorAll('iframe[src$="test=true"]')

  if (iframes.length > 0) {
    const len = iframes.length
    t.timeout(4500)
    await new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (retries-- < 0) {
          clearInterval(interval)
          reject(new Error(`no tests found in iframe`))
        }

        if (len === sbs.root.currentTest.nesteds.length) {
          clearInterval(interval)
          resolve()
        }
      }, 15)
    })
  }
}

export default function uiTest(fn, sbs) {
  let isInTestRunner = true

  requestIdleCallback(async () => {
    if (!inTop || sbs.started) return
    isInTestRunner = false
    selfExecute(sbs)
  })

  return async (t) => {
    index++

    t.utils.triggerOpener = async (...args) => triggerOpener(t, ...args)
    t.utils.makeRealmLab = async (...args) => makeRealmLab(t, ...args)
    t.utils.untilClose = async (...args) => untilClose(...args)

    if (!inTop || (!isInTestRunner && index === total)) {
      const { dest } = t.utils
      Object.assign(t.utils, {
        decay: (item) => item,
        dest(options = {}) {
          options.keep = true
          return dest(options)
        },
      })
    } else {
      t.utils.on({
        "uidialogopen || uipopupopen"(e, target) {
          t.utils.decay(unsee(target))
        },
      })
    }

    await 0 // queueMicrotask
    await fn(t, t.utils)

    t.timeout("reset")

    await whenIframesReady(t, sbs)

    t.timeout("reset")
  }
}
