const uniqueIdentifiers = new Map()

export default async function autoIncrementIdPlugin() {
  return (plan) => {
    if (plan?.id) {
      if (uniqueIdentifiers.has(plan.id)) {
        const cnt = uniqueIdentifiers.get(plan.id) + 1
        uniqueIdentifiers.set(plan.id, cnt)
        plan.id += cnt
      } else {
        uniqueIdentifiers.set(plan.id, 1)
      }
    }
  }
}
