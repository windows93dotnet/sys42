export default function idle() {
  return new Promise((resolve) => requestIdleCallback(resolve))
}
