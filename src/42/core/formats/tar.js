import tsTarExtract from "./tar/tsTarExtract.js"
import http from "../http.js"

async function extract(url, options) {
  // TODO: use Worker
  const items = []
  await http
    .source(url)
    .pipeThrough(tsTarExtract(options))
    .pipeTo(new WritableStream({ write: (item) => items.push(item) }))
  return items
}

export const tar = {
  extract,
}

export default tar
