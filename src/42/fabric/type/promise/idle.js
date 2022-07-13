if ("requestIdleCallback" in globalThis === false) {
  await import(
    "../../../system/env/polyfills/globalThis.requestIdleCallback.js"
  )
}

export default function idle() {
  return new Promise((resolve) => requestIdleCallback(resolve))
}
