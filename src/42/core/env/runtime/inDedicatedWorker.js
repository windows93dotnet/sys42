export default typeof self !== "undefined" &&
  typeof DedicatedWorkerGlobalScope !== "undefined" &&
  self instanceof DedicatedWorkerGlobalScope
