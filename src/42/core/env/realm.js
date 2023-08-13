// Importing env/realm modules in a Service Worker can make Linux Chrome crash for unknown reason.
// Declaring env variables directly here seems to be a valid workaround for this bug.

const windowExist = globalThis.window !== undefined
const selfExist = globalThis.self !== undefined

export default Object.freeze({
  inWindow: windowExist && window === window.self,
  inChildWindow: windowExist && globalThis.opener !== null,

  inTop: windowExist && window === window.top,
  inIframe: windowExist && window !== window.top,
  inOpaqueOrigin: globalThis.origin === "null",

  inWorker:
    selfExist &&
    globalThis.WorkerGlobalScope !== undefined &&
    self instanceof WorkerGlobalScope,
  inSharedWorker:
    selfExist &&
    globalThis.SharedWorkerGlobalScope !== undefined &&
    self instanceof SharedWorkerGlobalScope,
  inServiceWorker:
    selfExist &&
    globalThis.ServiceWorkerGlobalScope !== undefined &&
    self instanceof ServiceWorkerGlobalScope,
  inDedicatedWorker:
    selfExist &&
    globalThis.DedicatedWorkerGlobalScope !== undefined &&
    self instanceof DedicatedWorkerGlobalScope,
})
