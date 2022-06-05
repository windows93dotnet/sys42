import Callable from "./Callable.js"

export default class Canceller extends Callable {
  constructor(token) {
    const controller = new AbortController()
    super((reason) => {
      controller.abort(reason)
    })

    this.token = token
    this.signal = controller.signal
    this.cancel = this // allow `{cancel, signal} = new CancelToken()` syntax
  }

  fork(token) {
    if (this.signal.aborted) {
      throw new Error("Impossible to fork an aborted signal")
    }

    const fork = new Canceller(token)
    fork.parent = this

    this.signal.addEventListener(
      "abort",
      () => fork.cancel(this.signal.reason),
      { once: true }
    )

    return fork
  }
}
