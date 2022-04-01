export default function timeout(delay = 10_000) {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      reject(new Error(`Timeout error: ${delay}`))
    }, delay)
  )
}
