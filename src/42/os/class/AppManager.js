import disk from "../../system/fs/disk.js"

export default class AppManager {
  init() {
    console.log(disk.glob("**/*.cmd.js"))
    console.log(disk.glob("**/*.app.js"))
  }
}
