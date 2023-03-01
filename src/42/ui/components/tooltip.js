import Component from "../classes/Component.js"
import positionable from "../traits/positionable.js"

export class Tooltip extends Component {
  static plan = {
    tag: "ui-tooltip",
    role: "tooltip",
    id: true,

    props: {
      tail: "auto",
      my: "bottom",
      at: "top",
      of: "previous",
      within: "viewport",
      collision: "auto-my none",
    },
  }

  render({ tail, content, ...position }) {
    this.positionable = positionable(this, position)

    if (this.tail === "auto") {
      this.positionable.on("place", ({ my }) => {
        for (const name of this.classList) {
          if (name.startsWith("tail-")) this.classList.remove(name)
        }

        this.classList.add(`tail-${my.y[0]}${my.x[0]}`)
      })
    } else if (typeof this.tail === "string") {
      this.classList.add(`tail-${this.tail}`)
    }

    const { of } = this.positionable
    if (
      of instanceof Element &&
      !of.getAttribute("aria-describedby")?.includes(this.id) &&
      !of.getAttribute("aria-labelledby")?.includes(this.id)
    ) {
      of.setAttribute("aria-describedby", this.id)
    }

    return { content }
  }
}

const tooltip = Component.define(Tooltip)
export default tooltip

/* Auto tooltip for [title] and {text-overflow: ellipsis}
--------------------------------------------------------- */

import listen from "../../fabric/event/listen.js"
import debounce from "../../fabric/type/function/debounce.js"

let forgetPointerleave
function clean() {
  forgetPointerleave?.()
  tooltip.current?.remove()
  tooltip.current?.destroy()
  tooltip.target = undefined
  tooltip.current = undefined
}

listen({
  // TODO: display tooltip on focus

  "pointermove": debounce((e, target) => {
    target = target.closest("[tooltip],[data-tooltip]") ?? target

    if (
      target === tooltip.target ||
      e.target.contains(tooltip.current) ||
      tooltip.target?.contains(target) ||
      tooltip.current?.contains(target)
    ) {
      return
    }

    clean()

    const hasTooltipAttr = target.hasAttribute("tooltip")

    if (
      hasTooltipAttr ||
      target.dataset.tooltip ||
      (target.clientWidth < target.scrollWidth &&
        getComputedStyle(target).textOverflow === "ellipsis")
    ) {
      tooltip.target = target
      tooltip.current = tooltip({
        of: e,
        my: "left top",
        at: "right bottom",
        tail: false,
        content: hasTooltipAttr
          ? target.getAttribute("tooltip")
          : target.dataset.tooltip || target.textContent,
      })
      document.documentElement.append(tooltip.current)

      forgetPointerleave = listen(
        { "scroll || resize": clean },

        // skip debounce delay on pointerleave
        tooltip.target,
        {
          pointerleave(e) {
            if (!tooltip.current.contains(e.relatedTarget)) clean()
          },
        },

        tooltip.current,
        {
          pointerleave(e) {
            console.log(e.relatedTarget)
            if (!tooltip.target.contains(e.relatedTarget)) clean()
          },
        }
      )
    }
  }, 300),

  "mouseover || focusin"(e, target) {
    // disable default title tooltip for required and file inputs in chrome
    if (
      (target.required || target.type === "file") &&
      target.getAttribute("title") === null
    ) {
      target.title = ""
    }

    if (target.title) {
      target.dataset.tooltip = target.title
      target.title = ""
    }
  },
})
