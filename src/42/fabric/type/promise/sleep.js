const setTimeoutNative = globalThis.setTimeout

export default function sleep(ms = 100) {
  return new Promise((resolve) => setTimeoutNative(resolve, ms))
}
