export default typeof self !== "undefined" &&
  typeof SharedWorkerGlobalScope !== "undefined" &&
  self instanceof SharedWorkerGlobalScope
