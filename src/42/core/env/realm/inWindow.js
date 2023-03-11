export const inWindow =
  globalThis.window !== undefined && globalThis.window === globalThis.self
export default inWindow
