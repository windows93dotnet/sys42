import system from "../../../system.js"
import Trait from "../../classes/Trait.js"
import inIframe from "../../../core/env/realm/inIframe.js"
import uid from "../../../core/uid.js"
import ghostify from "../../../fabric/dom/ghostify.js"
import getRects from "../../../fabric/dom/getRects.js"
import { animateTo, animateFrom } from "../../../fabric/dom/animate.js"

function restoreSelection(el, droppeds) {
  const selectable = el[Trait.INSTANCES]?.selectable
  if (selectable) {
    selectable.clear()
    for (const item of droppeds) {
      const target = item.target ?? item
      selectable.add(target)
    }
  }
}

export class ItemsHint extends Array {
  constructor(options) {
    super()
    this.config = { ...options }
  }

  startAnimation() {
    return this.config.startAnimation
  }
  revertAnimation() {
    return this.config.revertAnimation
  }
  dropAnimation() {
    return this.config.dropAnimation
  }

  start(x, y, items) {
    this.length = 0
    for (const item of items) {
      this.push(item)

      item.offsetX ??= x - item.x
      item.offsetY ??= y - item.y

      item.target.id ||= uid()
      item.id = item.target.id

      if (!item.ghost) {
        item.ghost = ghostify(item.target, { rect: item })
        document.documentElement.append(item.ghost)
      }

      if (this.config.startAnimation && items.length > 1) {
        animateFrom(item.ghost, {
          translate: `${item.x}px ${item.y}px`,
          ...this.startAnimation(item),
        })
      }
    }

    this.drag(x, y)
  }

  drag() {}

  async revert(items = this) {
    const undones = []
    for (const item of items) {
      if (this.config.revertAnimation) {
        undones.push(
          animateTo(item.ghost, {
            translate: `${item.x}px ${item.y}px`,
            ...this.revertAnimation(item),
          }).then(() => {
            item.ghost.remove()
          })
        )
      } else {
        item.ghost.remove()
      }
    }

    const { dropzoneId } = this
    const dropzoneTarget = document.querySelector(`#${dropzoneId}`)
    if (dropzoneTarget) {
      const dropzone = system.transfer.dropzones.get(dropzoneTarget)
      dropzone?.revert()
    }

    await Promise.all(undones)
    if (dropzoneTarget) restoreSelection(dropzoneTarget, this)
  }

  async fork(x, y) {
    const ghostsCopy = this.map(({ ghost, x, y }) => {
      ghost = ghost.cloneNode(true)
      document.documentElement.append(ghost)
      return { x, y, ghost }
    })
    await Promise.all([
      this.revert(ghostsCopy), //
      this.adopt(x, y),
    ])
  }

  async adopt(x, y) {
    const dropzone = system.transfer.currentZone?.hint
    if (!dropzone || dropzone.isIframe) {
      for (const item of system.transfer.items) item.ghost.remove()
      return
    }

    if (inIframe) {
      for (const item of this) {
        item.ghost.classList.remove("hide")
        if (!item.ghost.isConnected) {
          item.ghost.style.top = 0
          item.ghost.style.left = 0
          document.documentElement.append(item.ghost)
        }
      }

      this.drag(x, y)
    }

    const { newIndex } = dropzone
    const { selector } = dropzone.config

    const undones = []
    let droppeds

    if (newIndex === undefined) {
      droppeds = dropzone.el.querySelectorAll(
        `${selector}:nth-last-child(-n+${this.length})`
      )
    } else {
      const start = newIndex + 1
      const end = newIndex + this.length
      droppeds = dropzone.el.querySelectorAll(
        `${selector}:nth-child(n+${start}):nth-child(-n+${end})`
      )
    }

    if (!(dropzone.inOriginalDropzone && system.transfer.effect === "copy")) {
      restoreSelection(dropzone.el, droppeds)
    }

    for (let i = 0, l = droppeds.length; i < l; i++) {
      droppeds[i].classList.add("invisible")
      // droppeds[i].id ||= uid()
      // this[i].target = droppeds[i]
    }

    const rects = await getRects(droppeds, {
      root: dropzone.el,
      intersecting: true,
    })

    for (let i = 0, l = this.length; i < l; i++) {
      const item = this[i]
      if (rects[i] && this.config.dropAnimation) {
        undones.push(
          animateTo(item.ghost, {
            translate: `${rects[i].x}px ${rects[i].y}px`,
            ...this.dropAnimation(item),
          }).then(() => {
            item.ghost.remove()
            rects[i].target.classList.remove("invisible")
          })
        )
      } else {
        item.ghost.remove()
        item.target.classList.remove("invisible")
      }
    }

    await Promise.all(undones)
  }
}

export default ItemsHint
