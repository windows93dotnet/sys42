// @read https://github.com/whatwg/dom/issues/946#issuecomment-773954201

import Callable from "./Callable.js"

export default class Canceller extends Callable {
  /** @type {Canceller|undefined} */
  parent

  constructor(signal) {
    const controller = new AbortController()
    let onabort
    super((reason) => {
      if (typeof reason === "string") {
        const { stack } = new Error(reason)
        reason = Object.defineProperties(
          new DOMException(reason, "AbortError"),
          {
            code: { value: DOMException.ABORT_ERR },
            name: { value: "AbortError" },
            message: { value: reason },
            stack: { value: stack },
          },
        )
      }

      controller.abort(reason)
      signal?.removeEventListener("abort", onabort)
    })

    if (signal) {
      onabort = () => this.cancel(signal.reason)
      signal.addEventListener("abort", onabort)
    }

    this.signal = controller.signal
    this.cancel = this // allow `{cancel, signal} = new CancelToken()` syntax
  }

  fork() {
    if (this.signal.aborted) {
      throw new Error("Impossible to fork a Canceller with aborted signal")
    }

    const fork = new Canceller()
    fork.parent = this

    this.signal.addEventListener("abort", () => fork.cancel(this.signal.reason))

    return fork
  }
}
