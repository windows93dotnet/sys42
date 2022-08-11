import inBackend from "../runtime/inBackend.js"
import inWorker from "./inWorker.js"

export default !inBackend && !inWorker
