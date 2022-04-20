const TYPE_STANDARD = {
  "application/x-javascript": "text/javascript",
}

async function normalize(item) {
  let { kind, type } = item

  type = TYPE_STANDARD[type] ?? type

  const file = item.getAsFile() || undefined
  const entry = item.webkitGetAsEntry() || undefined

  if (entry?.isDirectory) kind = "directory"

  const [handle, string] = await Promise.all([
    item.getAsFileSystemHandle?.() || undefined,
    kind === "string"
      ? new Promise((resolve) => item.getAsString((text) => resolve(text)))
      : undefined,
  ])

  let data

  try {
    data = JSON.parse(string)
  } catch {}

  return { kind, type, string, file, entry, handle, data }
}

export default async function normalizeDataTransfert(dataTransfer) {
  const out = { transfers: [] }

  out.items = (
    await Promise.all(Array.from(dataTransfer.items).map((x) => normalize(x)))
  ).filter(({ kind, type, entry, file, handle, string }) => {
    out.transfers.push(`${kind}:${type}`)
    return !(!string && !file && !entry && !handle)
  })

  return out
}
