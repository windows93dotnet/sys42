export default class Undones extends Array {
  then(resolve, reject) {
    return Promise.all(this).then(resolve, reject)
  }
}
