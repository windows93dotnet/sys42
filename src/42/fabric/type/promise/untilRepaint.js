export async function untilRepaint() {
  await new Promise((resolve) => requestAnimationFrame(resolve))
}

export default untilRepaint
