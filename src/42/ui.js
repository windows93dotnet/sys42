import UI from "./ui/classes/UI.js"
import asyncable from "./fabric/traits/asyncable.js"

export { UI }

export default function ui(...args) {
  const instance = new UI(...args)
  return asyncable(instance, async () => instance.done())
}
