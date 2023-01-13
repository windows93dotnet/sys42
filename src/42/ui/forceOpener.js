import uid from "../core/uid.js"

export default function forceOpener(plan) {
  if (!plan.opener) {
    document.activeElement.id ||= uid()
    plan.opener ??= document.activeElement.id
  }
}
