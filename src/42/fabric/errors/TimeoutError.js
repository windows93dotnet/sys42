export class TimeoutError extends Error {
  constructor(message) {
    super(typeof message === "number" ? `Timed out: ${message}ms` : message)
    Object.defineProperties(this, {
      name: { value: "TimeoutError" },
      code: { value: DOMException.TIMEOUT_ERR },
    })
  }
}

export default TimeoutError
