import uid from "../core/uid.js"

export default function forceOpener(def) {
  if (!def.opener) {
    document.activeElement.id ||= uid()
    def.opener ??= document.activeElement.id
  }
}
