const setTimeoutNative = globalThis.setTimeout

export default function timeout(
  ms = 5000,
  err = new Error(`Timed out: ${ms}ms`)
) {
  return new Promise((_, reject) => setTimeoutNative(() => reject(err), ms))
}
