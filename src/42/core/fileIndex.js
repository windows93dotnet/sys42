import system from "../system.js"
import FileIndex from "./fs/FileIndex.js"

export let fileIndex

if (system.fileIndex) fileIndex = system.fileIndex
else {
  fileIndex = new FileIndex()
  await fileIndex.init().catch(console.error)
  system.fileIndex = fileIndex
}

export default fileIndex
