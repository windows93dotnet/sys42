import addStack from "../../fabric/type/error/addStack.js"

export default class DatabaseError extends Error {
  constructor(error) {
    if (typeof error === "string") {
      super(error)
      Object.defineProperty(this, "name", { value: "DatabaseError" })
    } else {
      super(error.message)
      Object.assign(this, error)
      Object.defineProperty(this, "name", {
        value: error.name === "Error" ? "DatabaseError" : error.name,
      })
      if (error.stack) addStack(this, error.stack)
    }
  }
}
