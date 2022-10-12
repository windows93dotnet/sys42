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
      displayPicto: false,
      openEvents: "pointerdown || Enter || Space || ArrowDown",
      closeEvents: "pointerdown || ArrowLeft",
    },
  }
}

Component.define(Menubar)
