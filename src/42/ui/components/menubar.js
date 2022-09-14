import Component from "../class/Component.js"
import { Menu } from "./menu.js"

export class Menubar extends Menu {
  static definition = {
    tag: "ui-menubar",
    role: "menubar",
    on: {
      "ArrowLeft": "{{focusPrev()}}",
      "ArrowRight": "{{focusNext()}}",
      // "ArrowDown": "{{openCurrent()}}",
      "Tab": "{{focusOut('next', e)}}",
      "Shift+Tab": "{{focusOut('prev', e)}}",
    },
  }
}

Component.define(Menubar)
