import isNode from "./inNode.js"
import isDeno from "./inDeno.js"

export const inBackend = isNode || isDeno
export default inBackend
