export default async function untilRepaint() {
  await new Promise((resolve) => requestAnimationFrame(resolve))
}
