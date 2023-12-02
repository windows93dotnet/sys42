// Replacement for `new DOMException("...", "SecurityError")`
// Because DOMException has empty stack and poor console display
export class SecurityError extends Error {
  constructor(message) {
    super(message)
    Object.defineProperty(this, "name", { value: "SecurityError" })
  }
}

export default SecurityError
