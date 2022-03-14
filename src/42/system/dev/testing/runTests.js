import system from "../../../system.js"
import trap from "../../../fabric/type/error/trap.js"
import stackTrace from "../../../fabric/type/error/stackTrace.js"
import configure from "../../../fabric/configure.js"

const DEFAULTS = {
  serial: 0,
  keepIframes: false,
}

const listen = () =>
  trap((err) => {
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

    if (caughtByTest === true) return false
  })

export default async function runTests(options = {}) {
  if (typeof options === "function") options = { oneach: options }
  const config = configure(DEFAULTS, options)

  const forget = listen()
  await system.testing.root.init().runTests(config)
  forget()

  if (!config.keepIframes) system.testing.iframes.forEach((el) => el.remove())
}
