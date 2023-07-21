// @read https://stackoverflow.com/a/44700302

export default async function nextRepaint() {
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  )
}
