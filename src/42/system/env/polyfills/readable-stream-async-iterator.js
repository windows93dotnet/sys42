// @read https://streams.spec.whatwg.org/#rs-asynciterator
// @read https://jakearchibald.com/2017/async-iterators-and-generators/#making-streams-iterate
// @related https://gist.github.com/dy/8ca154c96e2b2a823c6501d29972b8a8

if (Symbol.asyncIterator in ReadableStream.prototype === false) {
  ReadableStream.prototype.values = function ({ preventCancel } = {}) {
    const reader = this.getReader()
    return {
      next() {
        return reader.read()
      },
      return() {
        if (preventCancel !== true) reader.cancel()
        reader.releaseLock()
        return {}
      },
      [Symbol.asyncIterator]() {
        return this
      },
    }
  }

  ReadableStream.prototype[Symbol.asyncIterator] =
    ReadableStream.prototype.values
}
