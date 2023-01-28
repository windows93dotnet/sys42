import system from "../system.js"
import Disk from "./fs/Disk.js"

let disk
if (system.disk) disk = system.disk
else {
  disk = new Disk()
  await disk.init()
  system.disk = disk
}

export { disk }
export default disk
