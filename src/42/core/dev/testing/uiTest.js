// import test from "../../../test.js"
import inTop from "../../env/realm/inTop.js"
import trap from "../../../fabric/type/error/trap.js"
import debounce from "../../../fabric/type/function/debounce.js"
import unsee from "../../../fabric/dom/unsee.js"

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
  trap()
}, 1)

export default function uiTest(fn, sbs) {
  let manual = false

  requestIdleCallback(async () => {
    if (!inTop && sbs.started) return
    manual = true
    selfExecute(sbs)
  })

  return async (t) => {
    index++

    if (!inTop || (manual && index === total)) {
      const { dest } = t.utils
      Object.assign(t.utils, {
        decay: (item) => item,
        dest(options = {}) {
          options.keep = true
          return dest(options)
          // return test.utils.dest(options)
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
  }
}
