export default class Undones extends Array {
  then(resolve, reject) {
    return Promise.all(this).then(resolve, reject)
  }

  async done() {
    return Promise.all(this).then((res) => {
      this.length = 0
      return res
    })
  }

  async call() {
    return Promise.all(this.map((task) => task())).then((res) => {
      this.length = 0
      return res
    })
  }

  async clear() {
    this.length = 0
  }
}
