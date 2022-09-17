import system from "./system.js"
import fs from "./core/fs.js"
import disk from "./core/disk.js"
import exec from "./os/exec.js"
import ui from "./ui.js"
import theme from "./os/theme.js"
import devices from "./core/devices.js"
// import apps from "./os/apps.js"

system.fs = fs
system.disk = disk
system.exec = exec
system.ui = ui
system.theme = theme
system.devices = devices
// system.apps = apps

document.documentElement.lang = "en"

export { default } from "./system.js"
