import fileIndex from "../../core/fileIndex.js"

export async function glob({ glob }) {
  return fileIndex.glob(glob)
}

export default glob
