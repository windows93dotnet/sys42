import inWindow from "../realm/inWindow.js"
import inStandalone from "./inStandalone.js"
import inAutomated from "./inAutomated.js"

export default inWindow && !inStandalone && !inAutomated
