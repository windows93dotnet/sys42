import Disk, { MASKS, RESERVED_BYTES } from "./Disk.js"
import system from "../../system.js"

const disk = new Disk()
await disk.init()
// await disk.upgrade() // TODO: make DEV env

disk.HOME = system.HOME
disk.MASKS = MASKS
disk.RESERVED_BYTES = RESERVED_BYTES

export default disk
