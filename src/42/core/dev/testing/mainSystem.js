import system from "../../../system.js"
import inIframe from "../../env/realm/inIframe.js"

let sys42 = system

if (inIframe) {
  try {
    sys42 = globalThis.top.sys42
  } catch {}
}

export default sys42
