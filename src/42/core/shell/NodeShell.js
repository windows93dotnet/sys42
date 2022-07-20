export default class NodeShell {
  get cwd() {
    return process.cwd()
  }

  set cwd(value) {
    this.chdir(value)
  }

  chdir(value) {
    process.chdir(value)
  }
}
