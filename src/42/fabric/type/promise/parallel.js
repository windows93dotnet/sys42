export default function parallel(tasks, fn = (res) => res) {
  return Promise.all(tasks.map((task, i) => fn(task, i)))
}
