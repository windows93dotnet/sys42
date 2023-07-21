export default async function repaint() {
  await new Promise((resolve) => requestAnimationFrame(resolve))
}
