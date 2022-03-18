import disk from "../../system/fs/disk.js"

export default async function open({ glob }) {
  return disk.glob(glob)
}
