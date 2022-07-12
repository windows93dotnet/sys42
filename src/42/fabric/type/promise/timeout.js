export default function timeout(
  delay = 5000,
  err = new Error(`Timed out: ${delay}ms`)
) {
  return new Promise((_, reject) => setTimeout(() => reject(err), delay))
}
