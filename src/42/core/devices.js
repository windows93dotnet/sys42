import keyboard from "./devices/keyboard.js"
import pointer from "./devices/pointer.js"
import gamepad from "./devices/gamepad.js"
import wheel from "./devices/wheel.js"

export const devices = {
  keys: keyboard.keys,
  codes: keyboard.codes,
  pointer: pointer.primary,
  pointers: pointer.list,
  gamepads: gamepad.status,
  wheel: wheel.axis,
}

const listen = () => {
  keyboard.listen()
  pointer.listen()
  gamepad.listen()
  wheel.listen()
}

const forget = () => {
  keyboard.forget()
  pointer.forget()
  gamepad.forget()
  wheel.forget()
}

Object.defineProperties(devices, {
  listen: { value: listen, enumerable: false },
  forget: { value: forget, enumerable: false },
})

export default devices
