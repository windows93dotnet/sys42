import defer from "../../../../fabric/type/promise/defer.js"
import serializeError from "../../../../fabric/type/error/serializeError.js"

export default class Test {
  constructor(suite, title, fn) {
    if (typeof title === "function") {
      fn = title
      title = fn.name || "anonymous"
    }

    this.suite = suite
    this.title = title
    this.fn = fn

    this.failing = false
    this.skip = false
    this.serial = false
    this.flaky = 0

    this.deferred = defer()
    this.deferred.promise.catch((err) => {
      if (this.ran === false) {
        this.ok = false
        this.error = err
      }
    })

    this.init()
  }

  init() {
    this.ms = 0
    this.ok = false
    this.ran = false
    this.error = undefined
    this.logs = []
  }

  toJSON() {
    const json = {
      title: this.title,
      suiteTitle: this.suite.title,
      suiteOk: this.suite.ok,
      stackframe: this.stackframe,
      failing: this.failing,
      ok: this.ok,
      ms: this.ms,
      skip: this.suite.skip || this.skip,
    }

    if (this.error) {
      json.error = serializeError(this.error)
      if (this.taskError) {
        const stackframe = serializeError(this.taskError).stack.at(-1)
        stackframe.function = "{task}"
        json.error.stack.push(stackframe)
      }
    }

    if (this.logs.length > 0) {
      json.logs = this.logs.map(([err, type, args]) => [
        serializeError(err).stack.pop(),
        type,
        args,
      ])
    }

    return json
  }
}
