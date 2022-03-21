import Disk from "./Disk.js"
import system from "../../system.js"

const disk = new Disk()
await disk.init()
// await disk.upgrade() // TODO: make DEV env

disk.HOME = system.HOME

export default disk
