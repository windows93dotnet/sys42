// @src https://stackoverflow.com/a/52695341

const modes = [
  "fullscreen",
  "standalone",
  "minimal-ui",
  "borderless",
  "window-controls-overlay",
]

export default Boolean(
  globalThis.matchMedia?.(
    modes.map((mode) => `(display-mode: ${mode})`).join(", ")
  ).matches !== true ||
    globalThis.navigator?.standalone ||
    globalThis.document?.referrer.includes("android-app://")
)
