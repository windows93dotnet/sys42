// @src https://github.com/sindresorhus/sdbm/blob/master/test.js

import test from "../../../../../42/test.js"
import sdbm from "../../../../../42/fabric/type/string/sdbm.js"

test("returns the hash as a positive integer", (t) => {
  t.is(sdbm(""), 0)
  t.is(sdbm("🦄🌈"), 4_053_542_802)

  t.is(sdbm("h"), 104)
  t.is(sdbm("he"), 6_822_397)
  t.is(sdbm("hel"), 865_822_127)
  t.is(sdbm("hell"), 418_186_877)
  t.is(sdbm("hello"), 684_824_882)
  t.is(sdbm("hello "), 2_764_485_486)
  t.is(sdbm("hello w"), 1_079_257_225)
  t.is(sdbm("hello wo"), 4_248_762_918)
  t.is(sdbm("hello wor"), 1_285_918_668)
  t.is(sdbm("hello worl"), 1_821_008_800)
  t.is(sdbm("hello world"), 430_867_652)

  t.is(
    sdbm(
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium."
    ),
    81_306_442
  )
})
