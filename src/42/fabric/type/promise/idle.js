if ("requestIdleCallback" in globalThis === false) {
  await import("../../../core/env/polyfills/globalThis.requestIdleCallback.js")
}

export async function idle(options) {
  await new Promise((resolve) => requestIdleCallback(resolve, options))
}

export default idle
