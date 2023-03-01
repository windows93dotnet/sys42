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
      !of.getAttribute("aria-describedby")?.includes(this.id) &&
      !of.getAttribute("aria-labelledby")?.includes(this.id)
    ) {
      of.setAttribute("aria-describedby", this.id)
    }

    return { content }
  }
}

export default Component.define(Tooltip)
