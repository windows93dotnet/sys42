export const inIframe =
  globalThis.window !== undefined && globalThis.window !== globalThis.top
export default inIframe
