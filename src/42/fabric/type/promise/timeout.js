import TimeoutError from "../../errors/TimeoutError.js"

const setTimeoutNative = globalThis.setTimeout

export function timeout(ms = 5000, err = new TimeoutError(ms)) {
  if (typeof err === "string") err = new TimeoutError(err)
  return new Promise((_, reject) => setTimeoutNative(() => reject(err), ms))
}

export default timeout
