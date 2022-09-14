import inTop from "../../env/realm/inTop.js"
import trap from "../../../fabric/type/error/trap.js"
import debounce from "../../../fabric/type/function/debounce.js"
// import { whenTestFileReady } from "./htmlTest.js"

// Integration tests self-execute if not started from a test runner.
// It allow to manually debug GUI tests inside a webpage
// because the last executed test will not decay elements/componenents

let total = 0
let index = 0

const selfExecute = debounce(async (sbs) => {
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

export default function intgTest(fn, sbs) {
  let manual = false

  requestIdleCallback(async () => {
    if (!inTop || sbs.started) return
    manual = true
    selfExecute(sbs)
  })

  return async (t) => {
    index++

    if (manual && index === total) {
      const { dest } = t.utils
      Object.assign(t.utils, {
        decay: (item) => item,
        dest(connect, options = {}) {
          options.keep = true
          return dest(connect, options)
        },
      })
    } else {
      // TODO: use mutation observer on document.body
      // to keep test.js decoupled from ui.js
      t.utils.listen({
        uidialogopen(e, target) {
          target.style.opacity = 0.01
          t.utils.decay(target)
        },
        uipopupopen(e, target) {
          target.style.opacity = 0.01
          t.utils.decay(target)
        },
      })
    }

    await 0 // queueMicrotask
    await fn(t, t.utils)

    // t.timeout("reset")

    // const iframes = document.querySelectorAll('iframe[src$="test=true"]')
    // if (iframes.length > 0) {
    //   t.timeout(3000)
    //   const undones = []

    //   for (const iframe of iframes) {
    //     undones.push(whenTestFileReady(iframe.src))
    //   }

    //   await Promise.all(undones)
    // }
  }
}
