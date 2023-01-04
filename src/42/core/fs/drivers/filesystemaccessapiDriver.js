// TODO: write driver when firefox support File System Access API
// @read https://developer.chrome.com/articles/file-system-access/#accessing-files-optimized-for-performance-from-the-origin-private-file-system

export async function isNotAllowed(handle, mode = "read") {
  const opts = { mode }
  if ((await handle.queryPermission(opts)) === "granted") return false
  if ((await handle.requestPermission(opts)) === "granted") return false
  return true
}

export async function writeFile(handle, contents) {
  if (await isNotAllowed(handle, "readwrite")) return false
  const writable = await handle.createWritable()
  await writable.write(contents)
  await writable.close()
}

export async function readDir(handle) {
  if (await isNotAllowed(handle)) return false
  for await (const [key, value] of handle.entries()) {
    console.log({ key, value })
  }
}

export const driver = () => {
  throw new Error("File System Access API isn't ready yet")
}
