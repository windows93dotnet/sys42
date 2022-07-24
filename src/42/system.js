export class System {}

globalThis.system42 ??= new System()
const system = globalThis.system42

system.polyfills = []
system.HOME ??= "/users/anonymous"
system.DEV = false

export default system
