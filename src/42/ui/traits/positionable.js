// @implement jqueryui position (https://jqueryui.com/position/)
// @read https://www.x.org/archive/X11R6.7.0/doc/X.7.html#sect6

import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import documentReady from "../../fabric/dom/documentReady.js"
import emittable from "../../fabric/traits/emittable.js"
import listen from "../../fabric/event/listen.js"
import repaintThrottle from "../../fabric/type/function/repaintThrottle.js"
import motionless from "../../fabric/dom/motionless.js"
import setTemp from "../../fabric/dom/setTemp.js"
import setRelativeToViewport from "../../fabric/dom/setRelativeToViewport.js"

const DEFAULTS = {
  my: "center center",
  at: "center center",
  of: "offsetParent",
  within: "viewport",
  collision: false,
  position: "fixed",
  minX: -Infinity,
  minY: -Infinity,
  maxX: Infinity,
  maxY: Infinity,
  subpixel: false,
  dynamic: true,
  signal: undefined,
}

const PRESETS = {
  menuitem: { my: "left top", at: "right top", collision: "flipfit" },
  popup: { my: "left top", at: "left bottom", collision: "flipfit" },
}

const configure = settings("ui.trait.positionable", DEFAULTS, PRESETS)

const { round } = Math
const { ELEMENT_NODE } = Node

const POSITION_REGEX = /(right|left|center)? ?(top|bottom|center)?/
const COLLISION_REGEX =
  /^(?:((?:flip|auto)?(?:fit)?|none)(?:-(my|at))?)? ?(?:((?:flip|auto)?(?:fit)?|none)(?:-(my|at))?)?$/

const OPPOSITES = {
  center: "center",
  top: "bottom",
  bottom: "top",
  right: "left",
  left: "right",
}

export const setCollisions = (obj, str) => {
  if (!str) return { x: false, y: false }
  let [, x, xOf, y, yOf] = str.match(COLLISION_REGEX)
  if (x === "none") x = false
  if (y === "none") y = false
  if (y === undefined) [y, yOf] = [x, xOf]
  obj.x.collision = x
  obj.x.kind = xOf
  obj.y.collision = y
  obj.y.kind = yOf
}

export const setAlignments = (obj, key, str) => {
  const [, x, y] = str.match(POSITION_REGEX)
  obj.x.alignment[key] = x || "center"
  obj.y.alignment[key] = y || "center"
  if (obj.x.collision) obj.x.flipped[key] = OPPOSITES[obj.x.alignment[key]]
  if (obj.y.collision) obj.y.flipped[key] = OPPOSITES[obj.y.alignment[key]]
}

function setSizes(obj, kind) {
  obj.y[kind].current = 0
  obj.x[kind].current = 0
  obj.y[kind].flipped = 0
  obj.x[kind].flipped = 0

  const el = kind === "my" ? obj.el : obj.of

  let h
  let w

  if (el.nodeType === ELEMENT_NODE) {
    h = el.offsetHeight
    w = el.offsetWidth
  } else if (el && "width" in el && "height" in el) {
    // DOMRect
    h = el.height
    w = el.width
  } else return

  if (obj.x.alignment[kind] === "right") obj.x[kind].current = w
  else if (obj.x.alignment[kind] === "center") obj.x[kind].current = w / 2
  if (obj.y.alignment[kind] === "bottom") obj.y[kind].current = h
  else if (obj.y.alignment[kind] === "center") obj.y[kind].current = h / 2

  if (obj.x.collision) {
    if (obj.x.flipped[kind] === "right") obj.x[kind].flipped = w
    else if (obj.x.flipped[kind] === "center") obj.x[kind].flipped = w / 2
  }

  if (obj.y.collision) {
    if (obj.y.flipped[kind] === "bottom") obj.y[kind].flipped = h
    else if (obj.y.flipped[kind] === "center") obj.y[kind].flipped = h / 2
  }
}

function setOffsets(obj) {
  obj.y.offset = obj.y.at.current - obj.y.my.current
  obj.x.offset = obj.x.at.current - obj.x.my.current
}

function findOffset(obj, kind, N, axis) {
  setSizes(obj, kind)
  setOffsets(obj)
  return N + axis.offset
}

// eslint-disable-next-line max-params
function findMostVisible(obj, kind, axis, n, N) {
  const { min, max } = axis
  if (n < min || n > max) {
    axis.alignment[kind] = "center"
    n = findOffset(obj, kind, N, axis)
    if (n < min) {
      axis.alignment[kind] = axis.boundary[kind].min
      n = findOffset(obj, kind, N, axis)
    } else if (n > max) {
      axis.alignment[kind] = axis.boundary[kind].max
      n = findOffset(obj, kind, N, axis)
    }
  }

  return n
}

function setFlip(axis) {
  axis.flip = axis.collision
    ? axis.kind === "at"
      ? axis.at.flipped - axis.my.current
      : axis.kind === "my"
        ? axis.at.current - axis.my.flipped
        : axis.at.flipped - axis.my.flipped
    : 0
}

const makePlaceEventData = (changes, obj) => ({
  // changes bytes: x-flipped y-flipped
  // @read https://webreflection.medium.com/about-bitwise-operations-1f983a9e6e25
  get my() {
    return {
      x:
        changes & 0x10 && (obj.x.kind === "my" || obj.x.kind === undefined)
          ? obj.x.flipped.my
          : obj.x.alignment.my,
      y:
        changes & 0x01 && (obj.y.kind === "my" || obj.y.kind === undefined)
          ? obj.y.flipped.my
          : obj.y.alignment.my,
    }
  },
  get at() {
    return {
      x:
        changes & 0x10 && (obj.x.kind === "my" || obj.x.kind === undefined)
          ? obj.x.flipped.at
          : obj.x.alignment.at,
      y:
        changes & 0x01 && (obj.y.kind === "at" || obj.y.kind === undefined)
          ? obj.y.flipped.at
          : obj.y.alignment.at,
    }
  },
})

class Positionable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)
    emittable(this)

    this.config.within =
      typeof this.config.within === "string" &&
      this.config.within !== "window" &&
      this.config.within !== "viewport"
        ? document.querySelector(this.config.within)
        : this.config.within

    this.of =
      this.config.of === "offsetParent"
        ? this.el.offsetParent ?? document.body
        : this.config.of === "parent"
          ? this.el.parentElement
          : this.config.of === "previous"
            ? this.el.previousElementSibling
            : this.config.of === "next"
              ? this.el.nextElementSibling
              : typeof this.config.of === "string"
                ? document.querySelector(this.config.of)
                : this.config.of

    setTemp(this.el, {
      signal: this.cancel.signal,
      style: {
        position: this.config.position,
        translate: "-200vw -200vh",
        top: 0,
        left: 0,
      },
    })

    this.round = this.config.subpixel ? (v) => v : round

    this.motion = motionless(this.el)

    let initial = 0
    let changes = 0x00

    const collisions = {
      fit: (n, N, { min, max }) => (n > max ? max : n < min ? min : n),

      flip(n, N, { min, max, mask, flip }) {
        if (n > max || n < min) {
          n = N + flip
          changes |= mask
        }

        return n
      },

      flipfit(n, N, { min, max, mask, flip, kind, alignment, boundary }) {
        kind ??= "my"

        if (kind === "my") {
          if (n > max && alignment[kind] === boundary[kind].min) {
            n = N + flip
            changes |= mask
          } else if (n < min && alignment[kind] === boundary[kind].max) {
            n = N + flip
            changes |= mask
          }
        } else if (n > max || n < min) {
          n = N + flip
          changes |= mask
        }

        return n > max ? max : n < min ? min : n
      },

      auto: (n, N, axis) => {
        const kind = axis.kind ?? "my"

        axis.alignment.my = axis.alignment.myInitial
        axis.alignment.at = axis.alignment.atInitial
        n = findOffset(this, kind, N, axis)

        n = findMostVisible(this, kind, axis, n, N)
        if (axis.kind === undefined) n = findMostVisible(this, "at", axis, n, N)

        return n
      },

      autofit(n, N, axis) {
        const { min, max } = axis
        n = collisions.auto(n, N, axis)
        return n > max ? max : n < min ? min : n
      },
    }

    this.place = (X, Y) => {
      let x = X + this.x.offset
      let y = Y + this.y.offset

      changes = 0x00

      if (this.x.collision) x = collisions[this.x.collision](x, X, this.x)
      if (this.y.collision) y = collisions[this.y.collision](y, Y, this.y)

      this.coords(x, y)

      if (initial || changes) {
        initial = 0
        this.emit("place", makePlaceEventData(changes, this))
      }
    }

    this.x = {
      mask: 0x10,
      min: this.config.minX,
      max: this.config.maxX,
      offset: 0,
      flip: 0,
      collision: false,
      kind: undefined,
      alignment: { my: undefined, at: undefined },
      boundary: {
        my: { max: "right", min: "left" },
        at: { max: "left", min: "right" },
      },
      flipped: { my: undefined, at: undefined },
      my: { current: 0, flipped: 0 },
      at: { current: 0, flipped: 0 },
    }

    this.y = {
      mask: 0x01,
      min: this.config.minY,
      max: this.config.maxY,
      offset: 0,
      flip: 0,
      collision: false,
      kind: undefined,
      alignment: { my: undefined, at: undefined },
      boundary: {
        my: { max: "bottom", min: "top" },
        at: { max: "top", min: "bottom" },
      },
      flipped: { my: undefined, at: undefined },
      my: { current: 0, flipped: 0 },
      at: { current: 0, flipped: 0 },
    }

    setCollisions(this, this.config.collision)
    setAlignments(this, "my", this.config.my)
    setAlignments(this, "at", this.config.at)

    this.x.alignment.myInitial = this.x.alignment.my
    this.y.alignment.myInitial = this.y.alignment.my
    this.x.alignment.atInitial = this.x.alignment.at
    this.y.alignment.atInitial = this.y.alignment.at

    this.start = (of = this.of) => {
      this.of = of

      setSizes(this, "my")
      setSizes(this, "at")
      setOffsets(this)

      setRelativeToViewport(this.el)

      if (this.x.collision || this.y.collision) {
        initial = 1
        setFlip(this.x)
        setFlip(this.y)
      } else {
        this.emit("place", makePlaceEventData(0x00_00, this))
      }

      if (this.config.within) {
        const withinRect =
          this.config.within === "window"
            ? {
                top: 0,
                left: 0,
                width: globalThis.innerWidth,
                height: globalThis.innerHeight,
              }
            : this.config.within === "viewport"
              ? {
                  top: globalThis.visualViewport.offsetTop,
                  left: globalThis.visualViewport.offsetLeft,
                  width: globalThis.visualViewport.width,
                  height: globalThis.visualViewport.height,
                }
              : this.config.within.getBoundingClientRect()

        this.x.min = withinRect.left
        this.y.min = withinRect.top
        this.x.max = withinRect.width - this.el.offsetWidth + this.x.min
        this.y.max = withinRect.height - this.el.offsetHeight + this.y.min
      }
    }

    const { signal } = this.cancel

    this.repaint = repaintThrottle(() => this.refresh())

    requestAnimationFrame(async () => {
      if (this.cancel.signal.aborted) return

      this.start()

      if (this.of) {
        this.update()

        if (this.of.nodeType === ELEMENT_NODE) {
          if (this.config.dynamic) {
            listen(
              document.fonts, //
              { signal },
              { loadingdone: this.repaint },
            )

            await documentReady()

            listen(
              window,
              { signal, passive: true },
              {
                "resize scroll transitionend animationend": this.repaint,
                "pointermove": ({ buttons }) =>
                  void (buttons > 0 && this.repaint()),
              },
            )
            listen(
              globalThis.visualViewport,
              { signal, passive: true },
              { "resize scroll": this.repaint },
            )
          } else {
            listen(
              document.fonts,
              { signal, once: true },
              { loadingdone: this.repaint },
            )
          }
        }
      }
    })
  }

  refresh(point) {
    this.start(point)
    this.update(point)
  }

  update(e = this.of) {
    if (e.nodeType === ELEMENT_NODE) {
      const { x, y } = e.getBoundingClientRect()
      this.place(x, y)
    } else {
      this.place(e.x, e.y) // DOMRect or MouseEvent
    }
  }

  coords(x, y) {
    const { round } = this
    this.motion.cancel()
    this.el.style.translate = `${round(x)}px ${round(y)}px`
    this.motion.restore()
  }
}

export function positionable(...args) {
  return new Positionable(...args)
}

export default positionable
