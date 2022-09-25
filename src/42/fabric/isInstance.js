// objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166

export default function isInstance(obj, Class) {
  return obj instanceof Class || obj?.constructor?.name === Class.name
}
