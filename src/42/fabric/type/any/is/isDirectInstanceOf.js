export default function isDirectInstanceOf(obj, Class) {
  if (!Class) return false
  return obj instanceof Class || obj?.constructor?.name === Class.name
}
