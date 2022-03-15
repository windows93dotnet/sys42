import resolvePath from "../../fabric/type/path/core/resolvePath.js"

export default class BrowserShell {
  #cwd = "/"

  get cwd() {
    return this.#cwd
  }

  set cwd(value) {
    this.chdir(value)
  }

  chdir(value) {
    this.#cwd = resolvePath(value)
  }
}
