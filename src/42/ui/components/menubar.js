import Component from "../classes/Component.js"
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
      focusBack: undefined,
      displayPicto: false,
      shortcuts: {
        openSubmenu: "pointerdown || Enter || Space || ArrowDown",
        closeSubmenu: "pointerdown || ArrowLeft",
      },
    },
  }
}

Component.define(Menubar)
