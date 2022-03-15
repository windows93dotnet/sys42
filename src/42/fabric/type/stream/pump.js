export default async function pump(stream, cb) {
  const reader = stream.getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    cb(value)
  }
}
