import Callable from "./Callable.js"

export default class Canceller extends Callable {
  constructor(signal) {
    const controller = new AbortController()
    let onabort
    super((reason) => {
      controller.abort(reason)
      if (signal) signal.removeEventListener("abort", onabort)
    })

    if (signal) {
      onabort = () => this.cancel(signal.reason)
      signal.addEventListener("abort", onabort, { once: true })
    }

    this.signal = controller.signal
    this.cancel = this // allow `{cancel, signal} = new CancelToken()` syntax
  }

  fork() {
    if (this.signal.aborted) {
      throw new Error("Impossible to fork an aborted signal")
    }

    const fork = new Canceller()
    fork.parent = this

    this.signal.addEventListener(
      "abort",
      () => fork.cancel(this.signal.reason),
      { once: true }
    )

    return fork
  }
}
