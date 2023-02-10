import system from "../../../system.js"
import Trait from "../../classes/Trait.js"
import inIframe from "../../../core/env/realm/inIframe.js"
import uid from "../../../core/uid.js"
import ghostify from "../../../fabric/dom/ghostify.js"
import paint from "../../../fabric/type/promise/paint.js"
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

function normalizeItem(item) {
  item.index |= 0

  item.x |= 0
  item.y |= 0
  item.width |= 0
  item.height |= 0

  item.marginTop |= 0
  item.marginBottom |= 0
  item.marginLeft |= 0
  item.marginRight |= 0

  item.left ??= item.x
  item.top ??= item.y
  item.bottom ??= item.y + item.height
  item.right ??= item.x + item.width

  if (item.target) {
    item.target.id ||= uid()
    item.id = item.target.id

    if (!item.ghost) {
      item.ghost = ghostify(item.target, { rect: item })
      document.documentElement.append(item.ghost)
    }
  }
}

export class ItemsHint extends Array {
  constructor(options) {
    super()
    this.config = { ...options }
    this.kind = this.config.kind
  }

  startAnimation() {
    return this.config.startAnimation
  }
  revertAnimation() {
    return this.config.revertAnimation
  }
  adoptAnimation() {
    return this.config.adoptAnimation
  }

  removeGhosts() {
    for (const { ghost } of this) ghost?.remove()
  }
  hideTargets() {
    for (const { target } of this) target?.classList.add("hide")
  }

  getCoord(x, y) {
    const [first] = system.transfer.items
    const { currentZone } = system.transfer

    return currentZone?.isOriginDropzone && currentZone?.freeAxis !== true
      ? currentZone.isVertical
        ? { x: first.x, y: y - first.offsetY }
        : { x: x - first.offsetX, y: first.y }
      : { x: x - first.offsetX, y: y - first.offsetY }
  }

  start(x, y, items) {
    this.length = 0
    for (const item of items) {
      normalizeItem(item)
      item.offsetX ??= x - item.x
      item.offsetY ??= y - item.y

      this.push(item)

      if (item.ghost && this.config.startAnimation && items.length > 1) {
        animateFrom(item.ghost, {
          translate: `${item.x}px ${item.y}px`,
          ...this.startAnimation(item),
        })
      }
    }

    this.drag(this.getCoord(x, y))
  }

  drag() {
    this.currentZone = system.transfer.currentZone
  }

  get originDropzone() {
    if (!this.dropzoneId) return
    const dropzoneTarget = document.querySelector(`#${this.dropzoneId}`)
    return dropzoneTarget
      ? system.transfer.dropzones.get(dropzoneTarget)
      : undefined
  }

  async revert(items = this) {
    const undones = []
    for (const item of items) {
      if (!item.ghost) break
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

    const { originDropzone } = this
    originDropzone?.revert()

    await Promise.all(undones)
    if (originDropzone?.el) restoreSelection(originDropzone.el, this)
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
    const dropzone = system.transfer.currentZone
    if (!dropzone || dropzone.isIframe) {
      system.transfer.items.removeGhosts()
      return
    }

    if (this[0]?.ghost === undefined) {
      const adopteds = []
      restoreSelection(dropzone.el, adopteds)
      await dropzone.beforeAdoptAnimation(adopteds)
      return
    }

    await paint()

    if (inIframe) {
      for (const item of this) {
        item.ghost.classList.remove("hide")
        if (!item.ghost.isConnected) {
          item.ghost.style.top = 0
          item.ghost.style.left = 0
          document.documentElement.append(item.ghost)
        }
      }

      this.drag(this.getCoord(x, y))
    }

    const { newIndex } = dropzone
    const { selector } = dropzone.config

    const undones = []
    let adopteds

    if (newIndex === undefined) {
      adopteds = dropzone.el.querySelectorAll(
        `${selector}:nth-last-child(-n+${this.length})`
      )
    } else {
      const start = newIndex + 1
      const end = newIndex + this.length
      adopteds = dropzone.el.querySelectorAll(
        `${selector}:nth-child(n+${start}):nth-child(-n+${end})`
      )
    }

    const rects = []
    for (let i = 0, l = adopteds.length; i < l; i++) {
      const rect = adopteds[i].getBoundingClientRect()
      rect.target = adopteds[i]
      rects.push(rect)
      queueMicrotask(() => dropzone.faintTarget(rect.target))
    }

    await dropzone.beforeAdoptAnimation(rects)

    for (let i = 0, l = this.length; i < l; i++) {
      const item = this[i]
      if (!item.ghost) {
        if (rects[i]) dropzone.reviveTarget(rects[i].target)
        continue
      }

      if (rects[i] && this.config.adoptAnimation) {
        undones.push(
          animateTo(item.ghost, {
            translate: `${rects[i].x}px ${rects[i].y}px`,
            ...this.adoptAnimation(item),
          }).then(() => {
            item.ghost.remove()
            dropzone.reviveTarget(rects[i].target)
          })
        )
      } else {
        item.ghost.remove()
        dropzone.reviveTarget(item.target)
      }
    }

    await Promise.all(undones)

    if (!(dropzone.isOriginDropzone && system.transfer.effect === "copy")) {
      restoreSelection(dropzone.el, adopteds)
    }
  }
}

export default ItemsHint
