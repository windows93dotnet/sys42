import disk from "../../core/fs/disk.js"

export default async function glob({ glob }) {
  return disk.glob(glob)
}
