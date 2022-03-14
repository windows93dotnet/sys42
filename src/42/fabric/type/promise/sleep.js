export default function sleep(delay = 100) {
  return new Promise((resolve) => setTimeout(resolve, delay))
}
