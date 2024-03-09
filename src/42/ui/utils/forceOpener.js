import uid from "../../core/uid.js"

export function forceOpener(plan) {
  if (!plan.opener) {
    document.activeElement.id ||= uid()
    plan.opener ??= document.activeElement.id
  }

  plan.opener = CSS.escape(plan.opener)
}

export default forceOpener
