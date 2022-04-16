export class System {}

globalThis.system42 ??= new System()
const system = globalThis.system42

system.polyfills = []
system.HOME ??= "/home/anonymous"
system.DEV = true

export default system
