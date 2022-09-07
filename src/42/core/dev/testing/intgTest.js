import debounce from "../../../fabric/type/function/debounce.js"

// Integration tests self-execute if not started from a test runner.
// It allow to manually debug GUI tests inside a webpage
// because the last executed test will not recycle created elements/componenents

let total = 0
let index = 0

const selfExecute = debounce(async (sbs) => {
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
}, 1)

export default function intgTest(fn, sbs) {
  let manual = false

  requestIdleCallback(async () => {
    if (sbs.started) return
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
      // TODO: use mutation observer to keep test.js decoupled from ui.js
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

    await 0

    await fn(t, t.utils)
  }
}
