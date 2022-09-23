export default async function paint() {
  await new Promise((resolve) => requestAnimationFrame(resolve))
}
