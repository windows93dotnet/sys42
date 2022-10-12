// @src https://stackoverflow.com/a/52695341

export default Boolean(
  globalThis.matchMedia?.("(display-mode: browser), (display-mode: fullscreen)")
    .matches !== true ||
    globalThis.navigator?.standalone ||
    globalThis.document?.referrer.includes("android-app://")
)
