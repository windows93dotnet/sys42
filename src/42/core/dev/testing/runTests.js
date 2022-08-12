import system from "../../../system.js"
import trap from "../../../fabric/type/error/trap.js"
import idle from "../../../fabric/type/promise/idle.js"
import stackTrace from "../../../fabric/type/error/stackTrace.js"
import configure from "../../configure.js"
import sleep from "../../../fabric/type/promise/sleep.js"

const DEFAULTS = {
  serial: false,
}

const uncaughts = []

const listenUncaughts = () =>
  trap(async (err, title, e) => {
    await sleep(0)
    if (e.defaultPrevented) return
    if ("module" in err) return

    let caughtByTest = false

    // Look if the uncaught error was throw inside a test
    stackTrace(err)
      .reverse()
      .find((stackFrame) => {
        if (stackFrame.filename in system.testing.testfiles) {
          const testfile = system.testing.testfiles[stackFrame.filename]
          const testIndex = Object.keys(testfile).find((testLine) => {
            testLine = Number(testLine)
            if (stackFrame.line >= testLine) {
              let { fn } = testfile[testLine]
              fn = fn.original || fn
              const testFnLines = fn.toString().split("\n").length
              if (stackFrame.line < testLine + testFnLines) return true
              return false
            }

            return false
          })

          if (testfile[testIndex]) {
            if (testfile[testIndex].ran !== true) caughtByTest = true
            testfile[testIndex].deferred.reject(err)
            return true
          }
        }

        return false
      })

    if (caughtByTest === false) uncaughts.push(err)
    return false
  })

export default async function runTests(options = {}) {
  if (typeof options === "function") options = { oneach: options }
  const config = configure(DEFAULTS, options)

  const forget = listenUncaughts()
  await system.testing.root.init().runTests(config)
  await idle()
  forget()

  if (uncaughts.length > 0) {
    system.testing.root.ok = false
    system.testing.root.uncaughts.push(...uncaughts)
  }
}
