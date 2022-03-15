import { httpGet } from "../../../fabric/http.js"
import LoadError from "./LoadError.js"

export default function rejectAsset(reject, message, url) {
  httpGet(url)
    .then(() => reject(new LoadError(message, { url })))
    .catch(reject)
}
