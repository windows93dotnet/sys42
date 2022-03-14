import inBackend from "./inBackend.js"
import inWorker from "./inWorker.js"

export default !inBackend && !inWorker
