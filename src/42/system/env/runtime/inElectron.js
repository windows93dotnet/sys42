// @src https://github.com/electron/electron/issues/2288#issuecomment-611231970

export default typeof globalThis.navigator?.userAgent === "string" &&
  /electron/i.test(navigator.userAgent)
