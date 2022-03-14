export default typeof self !== "undefined" &&
  typeof WorkerGlobalScope !== "undefined" &&
  self instanceof WorkerGlobalScope
