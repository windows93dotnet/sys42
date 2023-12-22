export class TimeoutError extends Error {
  constructor(message) {
    super(typeof message === "number" ? `Timed out: ${message}ms` : message)
    Object.defineProperty(this, "name", { value: "TimeoutError" })
  }
}

export default TimeoutError
