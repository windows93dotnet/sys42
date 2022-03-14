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
    const fork = new Canceller(token)
    this.signal.addEventListener(
      "abort",
      () => fork.cancel(this.signal.reason),
      { once: true }
    )
    return fork
  }
}
