import Component from "../class/Component.js"
import { Menu } from "./menu.js"

export class Menubar extends Menu {
  static definition = {
    tag: "ui-menubar",
    role: "menubar",
    shortcuts: [
      { key: "left", run: "focusPrev" },
      { key: "right", run: "focusNext" },
      { key: "down", run: "openCurrent" },
    ],
  }
}

export default await Component.define(Menubar)
