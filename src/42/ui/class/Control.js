// @read https://web.dev/more-capable-form-controls/

import Component from "./Component.js"

export default class Control extends Component {
  static formAssociated = true

  get value() {
    return this._.value
  }
  set value(val) {
    this._.value = val
  }

  get name() {
    return this._.name ?? ""
  }
  set name(val) {
    this._.name = val
    this.setAttribute("name", val)
  }

  get form() {
    return this._.internals.form
  }

  get type() {
    return this.localName
  }

  get validity() {
    return this._.internals.validity
  }

  get validationMessage() {
    return this._.internals.validationMessage
  }

  get willValidate() {
    return this._.internals.willValidate
  }

  checkValidity() {
    return this._.internals.checkValidity()
  }

  reportValidity() {
    return this._.internals.reportValidity()
  }
}
