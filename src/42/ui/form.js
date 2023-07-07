import listen from "../fabric/event/listen.js"
import { addPercentProp } from "../fabric/dom/setControlData.js"

let forgetWheel

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
      forgetWheel?.()
    },
    focus(e, target) {
      forgetWheel = listen({
        passive: false,
        wheel({ deltaY }) {
          if (target === document.activeElement && target.matches(":hover")) {
            const step = Number(target.step) | 1
            const value = Number(target.value) + (deltaY > 0 ? -step : step)
            if (target.max !== "" && value > Number(target.max)) return
            if (target.min !== "" && value <= Number(target.min)) return
            target.value = value // TODO: round to step decimal precision
            target.dispatchEvent(new Event("input", { bubbles: true }))
            // target.dispatchEvent(new Event("change", { bubbles: true }))
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
  },
)
