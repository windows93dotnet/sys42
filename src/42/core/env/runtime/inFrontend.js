import isNode from "./inNode.js"
import isDeno from "./inDeno.js"

export const inFrontend = !isNode && !isDeno
export default inFrontend
