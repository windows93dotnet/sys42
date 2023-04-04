import tarExtractPipe from "../../../core/formats/tar/tarExtractPipe.js"
import getPathInfos from "../../../core/path/getPathInfos.js"
import getDirname from "../../../core/path/core/getDirname.js"

const kit = {}

kit.install = async (version, options) => {
  if (await caches.has(version)) return

  kit.version = version

  const kitsFolder = options?.dirname ?? "42-kits"

  const [res, cache] = await Promise.all([
    fetch(`/${kitsFolder}/${version}.tar.gz`),
    kit.cache ?? caches.open(version),
  ])

  if (!res.ok) return

  kit.cache = cache

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

kit.update = async (path) => {
  kit.cache ??= await caches.open(kit.version)

  if (path.endsWith("index.html")) {
    const res = await fetch(path)
    await Promise.all([
      kit.cache.put(getDirname(path) + "/", res.clone()),
      kit.cache.put(path, res),
    ])
  } else await kit.cache.add(path)
}

export { kit }
export default kit
