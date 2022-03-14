// @src https://stackoverflow.com/a/52695341

export default Boolean(
  ("matchMedia" in globalThis &&
    globalThis.matchMedia("(display-mode: standalone)").matches) ||
    globalThis.navigator?.standalone ||
    globalThis.document?.referrer.includes("android-app://")
)
