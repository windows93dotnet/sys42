import UI from "./ui/classes/UI.js"

export { UI }

export default function ui(...args) {
  return new UI(...args)
}
