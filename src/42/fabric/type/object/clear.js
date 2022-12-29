export function clear(obj) {
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      delete obj[key]
    }
  }
}

export default clear
