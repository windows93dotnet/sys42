import getRects from "../../../fabric/dom/getRects.js"
import { inRect } from "../../../fabric/geometry/point.js"
import Canceller from "../../../fabric/classes/Canceller.js"
import system from "../../../system.js"
import unproxy from "../../../fabric/type/any/unproxy.js"

function copyElement(item, originDropzone) {
  const copy = item.target.cloneNode(true)
  originDropzone?.reviveTarget(copy)
  copy.id += "-copy"
  item.id = copy.id
  return copy
}

export class DropzoneHint {
  constructor(el, options) {
    this.el = el
    this.rects = []

    this.config = { ...options }

    this.config.orientation ??= this.el.getAttribute("aria-orientation")

    if (!this.config.orientation) {
      this.config.orientation = "horizontal"
      this.config.freeAxis ??= true
    }

    this.isHorizontal = this.config.orientation === "horizontal"
    this.isVertical = this.config.orientation === "vertical"
    this.freeAxis = this.config.freeAxis

    const styles = getComputedStyle(this.el)
    this.columnGap = Number.parseInt(styles.columnGap, 10) | 0
    this.rowGap = Number.parseInt(styles.rowGap, 10) | 0

    const halfColGap = this.columnGap / 2
    const halfRowGap = this.rowGap / 2
    this.gaps = {
      top: -halfRowGap,
      bottom: halfRowGap,
      left: -halfColGap,
      right: halfColGap,
    }
  }

  scan(items, cb) {
    this.rects.length = 0
    this.scanReady = getRects(this.config.selector, {
      root: this.el,
      intersecting: true,
    }).then((rects) => {
      if (items && cb) {
        for (const rect of rects) {
          if (cb(rect) !== false) this.rects.push(rect)
        }
      } else {
        this.rects.push(...rects)
      }

      return this.rects
    })

    return this.scanReady
  }

  faintTarget() {}
  reviveTarget() {}

  activate(x, y) {
    this.items = system.transfer.items
    this.isOriginDropzone = this.items.dropzoneId === this.el.id

    this.cancel = new Canceller(this.config.signal)
    this.signal = this.cancel.signal

    if (this.isOriginDropzone) {
      queueMicrotask(async () => {
        if (this.faintTargets) await this.faintTargets(x, y)
        else for (const { target } of this.items) this.faintTarget(target)
        if (system.transfer.currentZone === this) {
          await this.enter(x, y)
          this.dragover(x, y)
        }
      })
    }
  }

  halt() {
    this.cancel?.()
    this.el.classList.remove("dragover")

    if (this.isOriginDropzone) {
      if (system.transfer.effect === "move") {
        this.removeItems()
      }
    }

    if (this.items?.length > 0) {
      for (const { target } of this.items) this.reviveTarget(target)
    }

    this.rects.length = 0
    this.newIndex = undefined
    this.items = undefined
    this.cancel = undefined
    this.signal = undefined
    this.scanReady = undefined
  }

  dragover(x, y) {
    if (!this.items?.length) return
    const [first] = this.items

    this.newIndex = undefined

    if (this.isVertical) {
      y -= first.offsetY - first.height / 2
      for (let i = 0, l = this.rects.length; i < l; i++) {
        const rect = this.rects[i]
        if (
          y >= rect.top + this.gaps.top &&
          y <= rect.bottom + this.gaps.bottom
        ) {
          this.newIndex = rect.index
          break
        }
      }
    } else if (this.isHorizontal) {
      x -= first.offsetX - first.width / 2
      for (let i = 0, l = this.rects.length; i < l; i++) {
        const rect = this.rects[i]
        if (
          x >= rect.left + this.gaps.left &&
          x <= rect.right + this.gaps.right
        ) {
          this.newIndex = rect.index
          break
        }
      }
    } else {
      x -= first.offsetX - first.width / 2
      y -= first.offsetY - first.height / 2
      const point = { x, y }
      for (let i = 0, l = this.rects.length; i < l; i++) {
        const rect = this.rects[i]
        if (inRect(point, rect, this.gaps)) {
          this.newIndex = rect.index
          break
        }
      }
    }
  }

  async enter() {
    this.newIndex = undefined
    this.el.classList.add("dragover")
    await (this.scanReady === undefined ? this.scan() : this.scanReady)
  }

  leave() {
    this.el.classList.remove("dragover")
  }

  revert() {}

  removeItem(item, index) {
    if (item.removed) return
    if (this.config.list) this.config.list.splice(index, 1)
    else item.target.remove()
  }

  removeItems() {
    const removed = []
    for (const item of this.items) {
      let { index } = item
      for (const remIndex of removed) if (index > remIndex) index--
      removed.push(index)
      this.removeItem(item, index)
    }
  }

  async import() {
    return this.config.import?.(
      {
        items: system.transfer.items,
        effect: system.transfer.effect,
        kind: system.transfer.items.kind,
        index: this.newIndex,
        isOriginDropzone: this.isOriginDropzone,
        dropzone: this,
        get paths() {
          const paths = []
          for (const item of system.transfer.items) {
            const path =
              item.data?.path ?? item.data ?? item.target.getAttribute("path")
            if (path) paths.push(path)
          }

          return paths
        },
      },
      system.transfer
    )
  }

  async drop() {
    this.el.classList.remove("dragover")

    const { effect } = system.transfer

    const originDropzone = this.isOriginDropzone
      ? this
      : this.items.originDropzone

    const { selector, list } = this.config
    const droppeds = list ? [] : document.createDocumentFragment()

    const isMove = effect === "move"
    const isCopy = effect === "copy"

    const removed = []
    for (const item of this.items) {
      if (isMove) originDropzone?.reviveTarget(item.target)
      item.dropped = isMove

      let { index } = item

      if (isMove) {
        for (const remIndex of removed) if (index > remIndex) index--
        removed.push(index)
        if (this.isOriginDropzone && this.newIndex > index) this.newIndex--
      }

      if (list) {
        if (this.isOriginDropzone && isMove) {
          list.splice(index, 1)
          item.removed = true
        } else {
          item.target.classList.add("hide")
        }

        droppeds.push(isCopy ? unproxy(item.data) : item.data)
      } else {
        item.removed = isMove
        droppeds.append(
          isMove ? item.target : copyElement(item, originDropzone)
        )
      }
    }

    if (list) {
      if (this.newIndex === undefined) {
        list.push(...droppeds)
        this.config.indexChange?.(list.length)
      } else {
        list.splice(this.newIndex, 0, ...droppeds)
        this.config.indexChange?.(this.newIndex)
      }
    } else if (this.newIndex === undefined) {
      this.el.append(droppeds)
    } else {
      const indexedElement = this.el.querySelector(
        `${selector}:nth-child(${this.newIndex + 1})`
      )
      this.el.insertBefore(droppeds, indexedElement)
    }
  }

  beforeAdoptAnimation() {}
}

export default DropzoneHint
