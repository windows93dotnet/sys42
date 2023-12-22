import Deferred from "./Deferred.js"

export function defer(options) {
  return new Deferred(options)
}

export default defer
