if ("requestIdleCallback" in globalThis === false) {
  await import("../../../core/env/polyfills/globalThis.requestIdleCallback.js")
}

export default async function idle(options) {
  await new Promise((resolve) => requestIdleCallback(resolve, options))
}
