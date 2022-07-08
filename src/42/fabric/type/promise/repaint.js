// @read https://stackoverflow.com/a/44700302

export default function repaint() {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  )
}
