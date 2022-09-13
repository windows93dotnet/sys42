import ieee754 from "../../../../42/core/formats/ieee754.js"
import Buffer from "../../../../42/fabric/class/Buffer.compat.js"
import test from "../../../../42/test.js"

const EPSILON = 0.000_01

test("read float", (t) => {
  const val = 42.42
  const buf = Buffer.alloc(4)

  buf.writeFloatLE(val, 0)
  const num = ieee754.read(buf, 0, true, 23, 4)

  t.true(Math.abs(num - val) < EPSILON)
})

test("write float", (t) => {
  const val = 42.42
  const buf = Buffer.alloc(4)

  ieee754.write(buf, val, 0, true, 23, 4)
  const num = buf.readFloatLE(0)

  t.true(Math.abs(num - val) < EPSILON)
})

test("read double", (t) => {
  const value = 12_345.123_456_789
  const buf = Buffer.alloc(8)

  buf.writeDoubleLE(value, 0)
  const num = ieee754.read(buf, 0, true, 52, 8)

  t.true(Math.abs(num - value) < EPSILON)
})

test("write double", (t) => {
  const value = 12_345.123_456_789
  const buf = Buffer.alloc(8)

  ieee754.write(buf, value, 0, true, 52, 8)
  const num = buf.readDoubleLE(0)

  t.true(Math.abs(num - value) < EPSILON)
})
