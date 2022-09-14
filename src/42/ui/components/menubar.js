import Component from "../class/Component.js"
import { Menu } from "./menu.js"

export class Menubar extends Menu {
  static definition = {
    tag: "ui-menubar",
    role: "menubar",
    on: {
      ArrowLeft: "{{focusPrev()}}",
      ArrowRight: "{{focusNext()}}",
    },
    defaults: {
      displayPicto: false,
    },
  }
}

Component.define(Menubar)
