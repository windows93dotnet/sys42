import system from "./system.js"
import fs from "./core/fs.js"
import disk from "./core/disk.js"
import exec from "./os/exec.js"
import ui from "./ui.js"
import themeManager from "./os/managers/themeManager.js"
import appsManager from "./os/managers/appsManager.js"
import mimetypesManager from "./os/managers/mimetypesManager.js"
import devices from "./core/devices.js"

system.fs = fs
system.disk = disk
system.exec = exec
system.ui = ui
system.theme = themeManager
system.apps = appsManager
system.mimetypes = mimetypesManager
system.devices = devices

document.documentElement.lang = "en"

export { default } from "./system.js"
