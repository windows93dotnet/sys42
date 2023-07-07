/* eslint-disable complexity */

// @src https://github.com/paroga/cbor-js
//! Copyright (c) 2018 Patrick Gansterer <paroga@paroga.com>. MIT License.

import noop from "../../../fabric/type/function/noop.js"

const POW_2_32 = 4_294_967_296
const POW_2_24 = 5.960_464_477_539_063e-8

// the browser with the lowest limit is Chrome, with 0x1_00_00 args
// @see http://stackoverflow.com/a/22747272/680742
const MAX_ARGUMENTS_LENGTH = 0xff_ff

/**
 * @param {number[]} codePoints
 * @returns {string}
 */
export function decodeCodePointsArray(codePoints) {
  const len = codePoints.length
  if (len < MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode(...codePoints)
  }

  // Decode in chunks to avoid "call stack size exceeded".
  let res = ""
  let i = 0
  while (i < len) {
    res += String.fromCharCode(
      ...codePoints.slice(i, (i += MAX_ARGUMENTS_LENGTH)),
    )
  }

  return res
}

export function decodeCBOR(data, tagger = (val) => val, simpleValue = noop) {
  const dataView = new DataView(data)
  let offset = 0

  function commitRead(length, getter) {
    const value = dataView[getter](offset)
    offset += length
    return value
  }

  function readArrayBuffer(length) {
    const value = new Uint8Array(data, offset, length)
    offset += length
    return value
  }

  function readFloat16() {
    const tempArrayBuffer = new ArrayBuffer(4)
    const tempDataView = new DataView(tempArrayBuffer)
    const value = readUint16()

    const sign = value & 0x80_00
    let exponent = value & 0x7c_00
    const fraction = value & 0x03_ff

    if (exponent === 0x7c_00) {
      exponent = 0xff << 10
    } else if (exponent !== 0) {
      exponent += (127 - 15) << 10
    } else if (fraction !== 0) {
      return (sign ? -1 : 1) * fraction * POW_2_24
    }

    tempDataView.setUint32(
      0,
      (sign << 16) | (exponent << 13) | (fraction << 13),
    )
    return tempDataView.getFloat32(0)
  }

  const readFloat32 = () => commitRead(4, "getFloat32")
  const readFloat64 = () => commitRead(8, "getFloat64")
  const readUint8 = () => commitRead(1, "getUint8")
  const readUint16 = () => commitRead(2, "getUint16")
  const readUint32 = () => commitRead(4, "getUint32")
  const readUint64 = () => readUint32() * POW_2_32 + readUint32()

  function readBreak() {
    if (dataView.getUint8(offset) !== 0xff) return false
    offset += 1
    return true
  }

  function readLength(additionalInformation) {
    if (additionalInformation < 24) return additionalInformation
    if (additionalInformation === 24) return readUint8()
    if (additionalInformation === 25) return readUint16()
    if (additionalInformation === 26) return readUint32()
    if (additionalInformation === 27) return readUint64()
    if (additionalInformation === 31) return -1
    throw new Error("Invalid length encoding")
  }

  function readIndefiniteStringLength(majorType) {
    const initialByte = readUint8()
    if (initialByte === 0xff) return -1

    const length = readLength(initialByte & 0x1f)
    if (length < 0 || initialByte >> 5 !== majorType) {
      throw new Error("Invalid indefinite length element")
    }

    return length
  }

  function appendUtf16Data(utf16data, length) {
    for (let i = 0; i < length; ++i) {
      let value = readUint8()
      if (value & 0x80) {
        if (value < 0xe0) {
          value = ((value & 0x1f) << 6) | (readUint8() & 0x3f)
          length -= 1
        } else if (value < 0xf0) {
          value =
            ((value & 0x0f) << 12) |
            ((readUint8() & 0x3f) << 6) |
            (readUint8() & 0x3f)
          length -= 2
        } else {
          value =
            ((value & 0x0f) << 18) |
            ((readUint8() & 0x3f) << 12) |
            ((readUint8() & 0x3f) << 6) |
            (readUint8() & 0x3f)
          length -= 3
        }
      }

      if (value < 0x1_00_00) {
        utf16data.push(value)
      } else {
        value -= 0x1_00_00
        utf16data.push(0xd8_00 | (value >> 10), 0xdc_00 | (value & 0x3_ff))
      }
    }
  }

  function decodeItem() {
    const initialByte = readUint8()
    const majorType = initialByte >> 5
    const additionalInformation = initialByte & 0x1f
    let i
    let length

    if (majorType === 7) {
      switch (additionalInformation) {
        case 25:
          return readFloat16()
        case 26:
          return readFloat32()
        case 27:
          return readFloat64()
        default:
      }
    }

    length = readLength(additionalInformation)
    if (length < 0 && (majorType < 2 || majorType > 6)) {
      throw new Error("Invalid length")
    }

    switch (majorType) {
      case 0:
        return length

      case 1:
        return -1 - length

      case 2: {
        if (length < 0) {
          const elements = []
          let fullArrayLength = 0
          while ((length = readIndefiniteStringLength(majorType)) >= 0) {
            fullArrayLength += length
            elements.push(readArrayBuffer(length))
          }

          const fullArray = new Uint8Array(fullArrayLength)
          let fullArrayOffset = 0
          for (i = 0; i < elements.length; ++i) {
            fullArray.set(elements[i], fullArrayOffset)
            fullArrayOffset += elements[i].length
          }

          return fullArray
        }

        return readArrayBuffer(length)
      }

      case 3: {
        const utf16data = []
        if (length < 0) {
          while ((length = readIndefiniteStringLength(majorType)) >= 0) {
            appendUtf16Data(utf16data, length)
          }
        } else {
          appendUtf16Data(utf16data, length)
        }

        return decodeCodePointsArray(utf16data)
      }

      case 4: {
        let retArray
        if (length < 0) {
          retArray = []
          while (!readBreak()) retArray.push(decodeItem())
        } else {
          retArray = new Array(length)
          for (i = 0; i < length; ++i) retArray[i] = decodeItem()
        }

        return retArray
      }

      case 5: {
        const retObject = {}
        for (i = 0; i < length || (length < 0 && !readBreak()); ++i) {
          const key = decodeItem()
          retObject[key] = decodeItem()
        }

        return retObject
      }

      case 6:
        return tagger(decodeItem(), length)

      case 7:
        switch (length) {
          case 20:
            return false
          case 21:
            return true
          case 22:
            return null
          case 23:
            return
          default:
            return simpleValue(length)
        }

      default:
    }
  }

  const ret = decodeItem()
  if (offset !== data.byteLength) throw new Error("Remaining bytes")

  return ret
}

export default decodeCBOR
