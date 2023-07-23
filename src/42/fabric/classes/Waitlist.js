export default class Waitlist extends Array {
  then(resolve, reject) {
    return Promise.all(this).then(resolve, reject)
  }

  async done() {
    return Promise.all(this).then((res) => {
      this.length = 0
      return res
    })
  }

  async call(...args) {
    return Promise.all(this.map((task) => task(...args))).then((res) => {
      this.length = 0
      return res
    })
  }

  clear() {
    this.length = 0
  }
}
