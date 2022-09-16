if ("requestIdleCallback" in globalThis === false) {
  await import("../../../core/env/polyfills/globalThis.requestIdleCallback.js")
}

export default async function idle() {
  await new Promise((resolve) => requestIdleCallback(resolve))
}
