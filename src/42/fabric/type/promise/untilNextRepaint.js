// @read https://stackoverflow.com/a/44700302

export async function untilNextRepaint() {
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  )
}

export default untilNextRepaint
