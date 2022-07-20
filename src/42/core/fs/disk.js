import Disk from "./Disk.js"

const disk = new Disk()
await disk.init()
// await disk.upgrade() // TODO: make DEV env

export default disk
