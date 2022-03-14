export default function repaint() {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}
