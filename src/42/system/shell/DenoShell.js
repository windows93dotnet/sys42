export default class DenoShell {
  get cwd() {
    return Deno.cwd()
  }

  set cwd(value) {
    this.chdir(value)
  }

  chdir(value) {
    Deno.chdir(value)
  }
}
