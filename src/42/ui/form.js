import listen from "../fabric/event/listen.js"
import { addPercentProp } from "../fabric/dom/setControlData.js"

let wheelForget

const numericSelector = 'input:is([type="range"],[type="number"])'

listen(
  // Add range css prop
  {
    once: true,
    load() {
      for (const target of document.querySelectorAll(numericSelector)) {
        addPercentProp(target)
      }
    },
  },
  {
    selector: numericSelector,
    input(e, target) {
      addPercentProp(target)
    },
  },

  // Add increment/decrement on mousewheel
  {
    selector: numericSelector,
    capture: true,
    blur() {
      wheelForget?.()
    },
    focus(e, target) {
      wheelForget = listen({
        passive: false,
        wheel({ deltaY }) {
          if (target === document.activeElement) {
            const step = Number(target.step) || 1
            target.value = Number(target.value) + (deltaY > 0 ? -step : step)
            target.dispatchEvent(new Event("input", { bubbles: true }))
            target.dispatchEvent(new Event("change", { bubbles: true }))
            return false
          }
        },
      })
    },
  },

  // Prevent label selection on double click
  // @src https://stackoverflow.com/a/43321596
  {
    selector: "label",
    mousedown(e) {
      if (e.detail > 1) e.preventDefault()
    },
  }
)