import fileIndex from "../../core/fileIndex.js"

export default async function glob({ glob }) {
  return fileIndex.glob(glob)
}
