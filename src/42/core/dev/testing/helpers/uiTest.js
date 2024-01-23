import inTop from "../../../env/realm/inTop.js"
import trap from "../../../../fabric/type/error/trap.js"
import debounce from "../../../../fabric/type/function/debounce.js"
import isInstanceOf from "../../../../fabric/type/any/is/isInstanceOf.js"
import unsee from "../../../../fabric/dom/unsee.js"

import glovebox from "./glovebox.js"
import triggerOpener from "./triggerOpener.js"
import untilOpen from "./untilOpen.js"
import untilClose from "./untilClose.js"

// UI tests self-execute if not started from a test runner.
// It allow to manually debug GUI tests inside a webpage
// because the last executed test will not destroy GUI using t.utils.decay()

let total = 0
let index = 0

const selfExecute = debounce(async (sbs) => {
  sbs.running = true
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

export default function uiTest(fn, sbs) {
  requestIdleCallback(async () => {
    if (!inTop || sbs.running) return
    selfExecute(sbs)
  })

  return async (t) => {
    index++

    const id = `test--${t.test.slug}`

    t.glovebox = async (options, makeContent) => {
      if (typeof options === "function") {
        makeContent = options
        options = {}
      }

      options ??= {}
      options.makeContent ??= makeContent
      options.id = id
      return glovebox(t, options)
    }

    t.utils.triggerOpener = async (...args) => triggerOpener(t, ...args)
    t.utils.untilOpen = async (...args) => untilOpen(...args)
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
          if (!sbs.inTestRunner && index === total) {
            t.utils.decay(target)
          } else {
            t.utils.decay(unsee(target))
          }
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

    await fn(t, t.utils)
  }
}
