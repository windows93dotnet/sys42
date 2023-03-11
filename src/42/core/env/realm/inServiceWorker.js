export const inServiceWorker =
  globalThis.self !== undefined &&
  globalThis.ServiceWorkerGlobalScope !== undefined &&
  self instanceof ServiceWorkerGlobalScope
export default inServiceWorker
