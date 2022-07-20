export default class LoadError extends Error {
  constructor(message, details) {
    super(message)
    Object.defineProperty(this, "name", { value: "LoadError" })
    if (details) Object.assign(this, details)
  }
}
