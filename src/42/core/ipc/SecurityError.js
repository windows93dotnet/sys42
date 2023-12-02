export class SecurityError extends Error {
  constructor(message) {
    super(message)
    Object.defineProperty(this, "name", { value: "SecurityError" })
  }
}

export default SecurityError
