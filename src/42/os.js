import system from "./system.js"
import fs from "./system/fs.js"
import disk from "./system/fs/disk.js"
import exec from "./os/exec.js"
import ui from "./ui.js"
import theme from "./os/theme.js"
import devices from "./system/devices.js"

system.fs = fs
system.disk = disk
system.exec = exec
system.ui = ui
system.theme = theme
system.devices = devices

globalThis.$ = system

export { default } from "./system.js"
