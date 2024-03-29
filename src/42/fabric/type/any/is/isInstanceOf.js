// objects from other realms (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166

export default function isInstanceOf(obj, Class) {
  if (!Class) return false

  if (obj instanceof Class) return true

  let ctor = obj?.constructor

  while (ctor) {
    if (ctor.name === Class.name) return true
    ctor = Object.getPrototypeOf(ctor)
  }

  return false
}
