import sys42 from "../../../system.js"
import inIframe from "../../env/realm/inIframe.js"

export default inIframe ? globalThis.top.sys42 : sys42
