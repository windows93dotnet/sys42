/* eslint-disable complexity */

//! Copyright (c) 2018 Patrick Gansterer <paroga@paroga.com>. MIT License.

const POW_2_32 = 4_294_967_296
const POW_2_53 = 9_007_199_254_740_992

const BUF_NEG_ZERO = [0xf9, 0x80, 0x00]

export default function encode(value) {
  let data = new ArrayBuffer(256)
  let dataView = new DataView(data)
  let lastLength
  let offset = 0

  function prepareWrite(length) {
    let newByteLength = data.byteLength
    const requiredLength = offset + length
    while (newByteLength < requiredLength) newByteLength <<= 1

    if (newByteLength !== data.byteLength) {
      const oldDataView = dataView
      data = new ArrayBuffer(newByteLength)
      dataView = new DataView(data)
      const uint32count = (offset + 3) >> 2
      for (let i = 0; i < uint32count; ++i) {
        dataView.setUint32(i << 2, oldDataView.getUint32(i << 2))
      }
    }

    lastLength = length
    return dataView
  }

  function commitWrite() {
    offset += lastLength
  }

  function writeFloat64(value) {
    commitWrite(prepareWrite(8).setFloat64(offset, value))
  }

  function writeUint8(value) {
    commitWrite(prepareWrite(1).setUint8(offset, value))
  }

  function writeUint16(value) {
    commitWrite(prepareWrite(2).setUint16(offset, value))
  }

  function writeUint32(value) {
    commitWrite(prepareWrite(4).setUint32(offset, value))
  }

  function writeUint64(value) {
    const low = value % POW_2_32
    const high = (value - low) / POW_2_32
    const dataView = prepareWrite(8)
    dataView.setUint32(offset, high)
    dataView.setUint32(offset + 4, low)
    commitWrite()
  }

  function writeUint8Array(value) {
    const dataView = prepareWrite(value.length)
    for (let i = 0, l = value.length; i < l; i++) {
      dataView.setUint8(offset + i, value[i])
    }

    commitWrite()
  }

  function writeTypeAndLength(type, length) {
    if (length < 24) {
      writeUint8((type << 5) | length)
    } else if (length < 0x1_00) {
      writeUint8((type << 5) | 24)
      writeUint8(length)
    } else if (length < 0x1_00_00) {
      writeUint8((type << 5) | 25)
      writeUint16(length)
    } else if (length < 0x1_00_00_00_00) {
      writeUint8((type << 5) | 26)
      writeUint32(length)
    } else {
      writeUint8((type << 5) | 27)
      writeUint64(length)
    }
  }

  function encodeItem(value) {
    let i

    if (value === false) return writeUint8(0xf4)
    if (value === true) return writeUint8(0xf5)
    if (value === null) return writeUint8(0xf6)
    if (value === undefined) return writeUint8(0xf7)

    switch (typeof value) {
      case "number": {
        if (Object.is(value, -0)) return writeUint8Array(BUF_NEG_ZERO)

        if (Math.floor(value) === value) {
          if (value >= 0 && value <= POW_2_53) {
            return writeTypeAndLength(0, value)
          }

          if (-POW_2_53 <= value && value < 0) {
            return writeTypeAndLength(1, -(value + 1))
          }
        }

        writeUint8(0xfb)
        return writeFloat64(value)
      }

      case "string": {
        const utf8data = []
        for (i = 0; i < value.length; ++i) {
          let charCode = value.charCodeAt(i)
          if (charCode < 0x80) {
            utf8data.push(charCode)
          } else if (charCode < 0x8_00) {
            utf8data.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f))
          } else if (charCode < 0xd8_00) {
            utf8data.push(
              0xe0 | (charCode >> 12),
              0x80 | ((charCode >> 6) & 0x3f),
              0x80 | (charCode & 0x3f)
            )
          } else {
            charCode = (charCode & 0x3_ff) << 10
            charCode |= value.charCodeAt(++i) & 0x3_ff
            charCode += 0x1_00_00

            utf8data.push(
              0xf0 | (charCode >> 18),
              0x80 | ((charCode >> 12) & 0x3f),
              0x80 | ((charCode >> 6) & 0x3f),
              0x80 | (charCode & 0x3f)
            )
          }
        }

        writeTypeAndLength(3, utf8data.length)
        return writeUint8Array(utf8data)
      }

      default: {
        if (Array.isArray(value)) {
          const { length } = value
          writeTypeAndLength(4, length)
          for (i = 0; i < length; ++i) encodeItem(value[i])
        } else if (value instanceof Uint8Array) {
          writeTypeAndLength(2, value.length)
          writeUint8Array(value)
        } else {
          const keys = Object.keys(value)
          const { length } = keys
          writeTypeAndLength(5, length)
          for (i = 0; i < length; ++i) {
            const key = keys[i]
            encodeItem(key)
            encodeItem(value[key])
          }
        }
      }
    }
  }

  encodeItem(value)

  if ("slice" in data) {
    return data.slice(0, offset)
  }

  const ret = new ArrayBuffer(offset)
  const retView = new DataView(ret)
  for (let i = 0; i < offset; ++i) {
    retView.setUint8(i, dataView.getUint8(i))
  }

  return ret
}
