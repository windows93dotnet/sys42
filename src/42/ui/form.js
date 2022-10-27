import listen from "../fabric/event/listen.js"

function addRangeProp(target) {
  target.style.setProperty("--value", target.value)
}

let wheelForget

listen(
  // Add range css prop
  {
    once: true,
    load() {
      for (const target of document.querySelectorAll('input[type="range"]')) {
        addRangeProp(target)
      }
    },
  },
  {
    selector: 'input[type="range"]',
    input(e, target) {
      addRangeProp(target)
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

  // Add increment/decrement on mousewheel
  {
    selector: 'input[type="number"]',
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
  }
)
