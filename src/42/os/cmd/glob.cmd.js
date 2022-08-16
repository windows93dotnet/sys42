import disk from "../../core/disk.js"

export default async function glob({ glob }) {
  return disk.glob(glob)
}
