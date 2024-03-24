// Replacement for `new DOMException("...", "SecurityError")`
// Because DOMException has empty stack and poor console display
export class SecurityError extends Error {
  constructor(message) {
    super(message)
    Object.defineProperties(this, {
      name: { value: "SecurityError" },
      code: { value: DOMException.SECURITY_ERR },
    })
  }
}

export default SecurityError
