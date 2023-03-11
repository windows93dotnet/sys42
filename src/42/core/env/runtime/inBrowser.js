import inWindow from "../realm/inWindow.js"
import inPWA from "./inPWA.js"
import inAutomated from "./inAutomated.js"

export const inBrowser = inWindow && !inPWA && !inAutomated
export default inBrowser
