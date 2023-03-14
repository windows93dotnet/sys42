export const inChildWindow =
  globalThis.window !== undefined && globalThis.opener !== null
export default inChildWindow
