import disk from "../../system/fs/disk.js"

export default async function glob({ glob }) {
  return disk.glob(glob)
}
