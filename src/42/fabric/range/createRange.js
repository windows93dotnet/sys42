// @read https://calendar.perfplanet.com/2017/mutating-web-content-using-dom-ranges/

import disposable from "../../fabric/traits/disposable.js"

const createRange = disposable(() => document.createRange())
export default createRange
