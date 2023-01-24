export function isDirDescriptor(desc) {
  if (Array.isArray(desc) || desc === 0 || desc == null) return false
  return typeof desc === "object"
}

export default isDirDescriptor
