export class System {}

globalThis.system42 ??= new System()
const system = globalThis.system42
system.polyfills = []
system.HOME ??= "/42/user/anonymous"

export default system
