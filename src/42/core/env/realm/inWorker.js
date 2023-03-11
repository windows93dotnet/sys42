export const inWorker =
  globalThis.self !== undefined &&
  globalThis.WorkerGlobalScope !== undefined &&
  self instanceof WorkerGlobalScope
export default inWorker
