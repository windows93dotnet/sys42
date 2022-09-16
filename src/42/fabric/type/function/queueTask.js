let id = 0
const queue = new Map()
const { port1, port2 } = new MessageChannel()
port2.onmessage = ({ data: id }) => {
  queue.get(id)?.()
  queue.delete(id)
}

export default function queueTask(fn) {
  queue.set(++id, fn)
  port1.postMessage(id)
}
