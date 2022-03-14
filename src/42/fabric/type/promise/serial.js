export default async function serial(tasks, fn = (res) => res) {
  const out = []

  for (let i = 0, l = tasks.length; i < l; i++) {
    out.push(await fn(tasks[i], i, tasks, out))
  }

  return out
}
