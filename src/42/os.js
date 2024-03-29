import "./ui/head.js"

import system from "./system.js"

import fs from "./core/fs.js"
import fileIndex from "./core/fileIndex.js"
import actions from "./os/actions.js"
import exec from "./exec.js"
import ui from "./ui.js"
import themeManager from "./os/managers/themeManager.js"
import appsManager from "./os/managers/appsManager.js"
import mimetypesManager from "./os/managers/mimetypesManager.js"
import devices from "./core/devices.js"

system.fs = fs
system.fileIndex = fileIndex
system.exec = exec
system.actions = actions
system.ui = ui
system.theme = themeManager
system.apps = appsManager
system.mimetypes = mimetypesManager
system.devices = devices

export default system
