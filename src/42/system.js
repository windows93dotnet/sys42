export class System {}

globalThis.system42 ??= new System()
globalThis.system42.polyfills = []

export default globalThis.system42
