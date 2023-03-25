import tarExtractPipe from "../../../core/formats/tar/tarExtractPipe.js"
import getPathInfos from "../../../core/path/getPathInfos.js"
import getDirname from "../../../core/path/core/getDirname.js"

export async function installKit(version, options) {
  if (await caches.has(version)) return

  const kitsFolder = options?.dirname ?? "42-kits"

  const [res, cache] = await Promise.all([
    fetch(`/${kitsFolder}/${version}.tar.gz`),
    caches.open(version),
  ])

  if (!res.ok) return

  const undones = []

  const sink = new WritableStream({
    async write(item) {
      if (item.type === "file") {
        const { headers } = getPathInfos(item.name, { headers: true })
        headers["Content-Length"] = item.size
        headers["42-Kit-Version"] = version
        const res = new Response(item.file, { headers })

        if (item.name.endsWith("index.html")) {
          undones.push(cache.put(getDirname(item.name) + "/", res.clone()))
        }

        undones.push(cache.put(item.name, res))
      }
    },
  })

  await res.body.pipeThrough(tarExtractPipe({ gzip: true })).pipeTo(sink)
  await Promise.all(undones)
}

export default installKit
