const uniqueIdentifiers = new Map()

export default async function autoIncrementIdPlugin() {
  return (def) => {
    if (def?.id) {
      if (uniqueIdentifiers.has(def.id)) {
        const cnt = uniqueIdentifiers.get(def.id) + 1
        uniqueIdentifiers.set(def.id, cnt)
        def.id += cnt
      } else {
        uniqueIdentifiers.set(def.id, 1)
      }
    }
  }
}
