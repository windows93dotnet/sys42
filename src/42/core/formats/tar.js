import tarExtractPipe from "./tar/tarExtractPipe.js"
import http from "../http.js"

async function extract(url, options) {
  // TODO: use Worker
  const items = []
  await http
    .source(url)
    .pipeThrough(tarExtractPipe(options))
    .pipeTo(new WritableStream({ write: (item) => items.push(item) }))
  return items
}

export const tar = {
  extract,
}

export default tar
