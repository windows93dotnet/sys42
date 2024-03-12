import uid from "../../core/uid.js"

/**
 * @template {object} T
 * @param {T} plan
 * @returns {T}
 */
export function ensureOpener(plan) {
  if (!plan.opener) {
    document.activeElement.id ||= uid()
    plan.opener = document.activeElement.id
  }

  plan.opener = CSS.escape(plan.opener)

  return plan
}

export default ensureOpener
