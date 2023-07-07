import test from "../../../../../42/test.js"
import isMultipleOf from "../../../../../42/fabric/type/number/isMultipleOf.js"

const { task } = test

test.tasks(
  [
    task({ num: 42, mult: 1, expected: true }),
    task({ num: 42, mult: 2, expected: true }),
    task({ num: 42, mult: 3, expected: true }),

    task({ num: 42, mult: 4, expected: false }),
    task({ num: 42, mult: 0, expected: false }),

    task({ num: 0.1, mult: 0.1, expected: true }),
    task({ num: 0.3, mult: 0.1, expected: true }),
    task({ num: 0.000_000_3, mult: 0.000_000_1, expected: true }),
    task({ num: 0.000_000_4, mult: 0.000_000_1, expected: true }),
    task({ num: 0.000_000_4, mult: 0.000_000_2, expected: true }),
    task({ num: 0.000_000_04, mult: 0.000_000_02, expected: true }),
    task({ num: 0.000_000_04, mult: 0.000_000_03, expected: false }),

    task({ num: 0.3, mult: 0.2, expected: false }),
    task({ num: 0.000_000_3, mult: 0.000_000_2, expected: false }),

    task({ num: 53.198_098, mult: 0.000_001, expected: true }),
    task({ num: 53.198_098, mult: 0.000_002, expected: true }),
    task({ num: 53.198_098_8, mult: 0.000_000_1, expected: true }),
    task({ num: 53.198_098_8, mult: 0.000_000_2, expected: true }),

    task({ num: 53.198_098, mult: 0.000_005, expected: false }),
    task({ num: 53.198_098, mult: 0.000_000_1, expected: false }),
    task({ num: 53.198_098_8, mult: 0.000_000_5, expected: false }),

    task({ num: 42, mult: Number.NaN, expected: false }),
    task({ num: Number.NaN, mult: 1, expected: false }),
    task({ num: 42, mult: Infinity, expected: false }),
    task({ num: Infinity, mult: 1, expected: false }),
    task({ num: Infinity, mult: 0.1, expected: false }),
  ],
  (test, { num, mult, expected }) => {
    test(num, mult, (t) => {
      t.is(isMultipleOf(num, mult), expected)
    })
  },
)
