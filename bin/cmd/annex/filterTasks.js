export default function filterTasks(list) {
  const onlies = []

  const allowlist = []

  let hadSkippedOnlies = false

  for (const item of list) {
    if (item) {
      if (item.skip !== true && item.disabled !== true && item.if !== false) {
        if (item.only === true) {
          onlies.push(item)
        } else {
          allowlist.push(item)
        }
      } else if (item.only === true) {
        hadSkippedOnlies = true
      }
    }
  }

  return onlies.length > 0 || hadSkippedOnlies ? onlies : allowlist
}
