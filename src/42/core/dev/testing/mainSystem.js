import sys42 from "../../../system.js"
import inIframe from "../../env/runtime/inIframe.js"

export default inIframe ? globalThis.top.sys42 : sys42
