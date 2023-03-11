export const inSharedWorker =
  globalThis.self !== undefined &&
  globalThis.SharedWorkerGlobalScope !== undefined &&
  self instanceof SharedWorkerGlobalScope
export default inSharedWorker
