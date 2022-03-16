// @read https://w3c.github.io/gamepad/#dfn-standard-gamepad-layout
// @read https://github.com/neogeek/gamepad.js#buttons
// @read https://cyangmou.itch.io/animated-button-props-for-consols
// @read https://sancarlosminas.info/46-xbox-one-controller-layout-cz8y/xbox-one-controller-layout-play-half-life-with-xbox-360-controller-on-mac-osx/

/*
       ╭╴ 6 ╶╮                ╭╴ 7 ╶╮
  ╭────┤╴ 4 ╶├────────────────┤╴ 5 ╶├────╮
  │     ┌───┐                  ┌───┐     │
  │     │ 12│        16        │ 3 │     │
  │ ┌───┼───┼───┐          ┌───┼───┼───┐ │
  │ │ 14│   │ 15│          │ 2 │   │ 1 │ │
  │ └───┼───┼───┘  8    9  └───┼───┼───┘ │
  │     │ 13│                  │ 0 │     │
  │     └───┘ ╭ - ─╮    ╭─ - ╮ └───┘     │
  ╰────── [0] - 10 + ── - 11 + [2] ──────╯
              ╰ + ─╯    ╰─ + ╯
               [1]        [3]
*/

// @implement https://github.com/w3c/gamepad/issues/4#issuecomment-354749126
// TODO: rewrite using https://docs.google.com/document/d/1At2ZsMOow4LmIhLs_LfnUV8J9glJS8qSyW-PqYtrQVA/edit

export class GamepadEvent extends Event {
  constructor(type, index, value, gamepad) {
    super(type, { bubbles: true })
    this.index = index
    this.value = value
    this.gamepad = gamepad
  }

  getCoalescedEvents() {
    return [this] // just a shim for now
  }
}

const LAYOUTS = {
  standard: {
    0: "RIGHT_CLUSTER_BOTTOM",
    1: "RIGHT_CLUSTER_RIGHT",
    2: "RIGHT_CLUSTER_LEFT",
    3: "RIGHT_CLUSTER_TOP",
    4: "TOP_LEFT_FRONT",
    5: "TOP_RIGHT_FRONT",
    6: "BOTTOM_LEFT_FRONT",
    7: "BOTTOM_RIGHT_FRONT",
    8: "CENTER_CLUSTER_LEFT",
    9: "CENTER_CLUSTER_RIGHT",
    10: "LEFT_STICK_BUTTON",
    11: "RIGHT_STICK_BUTTON",
    12: "UP",
    13: "DOWN",
    14: "LEFT",
    15: "RIGHT",
    16: "VENDOR",
  },

  xbox: {
    0: "A",
    1: "B",
    2: "X",
    3: "Y",
    4: "LB",
    5: "RB",
    6: "LT",
    7: "RT",
    8: "BACK",
    9: "START",
  },

  // ✖ ● ◼ ▲
  // ✕ ◯ □ △
  playstation: {
    0: "CROSS",
    1: "CIRCLE",
    2: "SQUARE",
    3: "TRIANGLE",
    4: "L1",
    5: "R1",
    6: "L2",
    7: "R2",
    8: "SELECT",
    9: "START",
  },

  nintendo: {
    0: "B",
    1: "A",
    2: "Y",
    3: "X",
    4: "L",
    5: "R",
    6: "ZL",
    7: "ZR",
    8: "-",
    9: "+",
  },
}

Object.entries(LAYOUTS).forEach(([key, value]) => {
  if (key !== "standard") {
    LAYOUTS[key] = { ...LAYOUTS.standard, ...value }
  }
})

const aliases = {}

for (const item of [
  ...Array.from({ length: 17 })
    .fill("")
    .map((x, i) => `button_${i + 1} ${i}`),
  "TOP_LEFT_BUTTON 4",
  "TOP_RIGHT_BUTTON 5",
  "BOTTOM_LEFT_BUTTON 6",
  "BOTTOM_RIGHT_BUTTON 7",
  "SELECT 8",
  "START 9",
  "↑ 12",
  "↓ 13",
  "← 14",
  "→ 15",
  "HOME 16",
]) {
  const tokens = item.split(" ")
  const n = Number(tokens.pop())
  const value = `button_${n}`
  tokens.forEach((token) => {
    token = token.toLowerCase()
    Object.entries(LAYOUTS).forEach(([vendor, layout]) => {
      let name = layout[n].toLowerCase()
      if (vendor !== "standard") name = `${vendor}:${name}`
      aliases[name] = value
      name = token
      if (vendor !== "standard") name = `${vendor}:${name}`
      aliases[name] = value
    })
  })
}

const update = () => {
  for (const pad of navigator.getGamepads()) {
    if (pad) {
      const tracked = tracker.get(pad.index)
      if (tracked) {
        if (tracked.timestamp !== pad.timestamp) {
          tracked.buttons = pad.buttons.map(({ pressed, value }, index) => {
            if (tracked.buttons[index].pressed !== pressed) {
              const btnName = `gamepad_${pad.index}_button_${index}`
              if (pressed) {
                status[btnName] = value
                document.activeElement.dispatchEvent(
                  new GamepadEvent("buttondown", index, value, pad)
                )
              } else {
                delete status[btnName]
                document.activeElement.dispatchEvent(
                  new GamepadEvent("buttonup", index, value, pad)
                )
              }
            }

            if (tracked.buttons[index].value !== value) {
              document.activeElement.dispatchEvent(
                new GamepadEvent("buttonchange", index, value, pad)
              )
            }

            return { pressed, value }
          })
          tracked.axes = pad.axes.map((value, index) => {
            if (tracked.axes[index] !== value) {
              const axisName = `gamepad_${pad.index}_axis_${index}`
              if (value === 0) delete status[axisName]
              else status[axisName] = value
              document.activeElement.dispatchEvent(
                new GamepadEvent("axischange", index, value, pad)
              )
            }

            return value
          })
          tracked.timestamp = pad.timestamp
        }
      } else addGamepad(pad)
    }
  }
}

const status = {}
const tracker = new Map()

const addGamepad = ({ index, timestamp, buttons, axes }) => {
  const gamepad = {
    timestamp,
    buttons: buttons.map(({ pressed, value }) => ({ pressed, value })),
    axes: [...axes],
  }
  tracker.set(index, gamepad)
  return gamepad
}

const deleteGamepad = ({ index }) => tracker.delete(index)

const addHandler = (e) => addGamepad(e.gamepad)
const deleteHandler = (e) => deleteGamepad(e.gamepad)

let mainloop
export const forget = () => {
  globalThis.removeEventListener("gamepadconnected", addHandler)
  globalThis.removeEventListener("gamepaddisconnected", deleteHandler)
  mainloop?.delete("gamepad", update)
  gamepad.isListening = false
}

export const listen = (options) => {
  if (gamepad.isListening) return forget
  globalThis.addEventListener("gamepadconnected", addHandler)
  globalThis.addEventListener("gamepaddisconnected", deleteHandler)
  gamepad.isListening = true

  if (options?.mainloop !== false) {
    import("../../fabric/mainloop.js").then((m) => {
      mainloop = m.default
      mainloop.add("gamepad", update)
    })
  }

  return forget
}

const gamepad = { status, aliases, update, listen, forget, isListening: false }
export default gamepad
