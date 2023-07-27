import test from "../../../../../42/test.js"
import isMultipleOf from "../../../../../42/fabric/type/number/isMultipleOf.js"

const { task } = test

test.tasks(
  [
    task({ num: 42, divisor: 1, expected: true }),
    task({ num: 42, divisor: 2, expected: true }),
    task({ num: 42, divisor: 3, expected: true }),

    task({ num: 42, divisor: 4, expected: false }),
    task({ num: 42, divisor: 0, expected: false }),

    task({ num: 0.1, divisor: 0.1, expected: true }),
    task({ num: 0.3, divisor: 0.1, expected: true }),
    task({ num: 0.000_000_3, divisor: 0.000_000_1, expected: true }),
    task({ num: 0.000_000_4, divisor: 0.000_000_1, expected: true }),
    task({ num: 0.000_000_4, divisor: 0.000_000_2, expected: true }),
    task({ num: 0.000_000_04, divisor: 0.000_000_02, expected: true }),
    task({ num: 0.000_000_04, divisor: 0.000_000_03, expected: false }),

    task({ num: 0.3, divisor: 0.2, expected: false }),
    task({ num: 0.000_000_3, divisor: 0.000_000_2, expected: false }),

    task({ num: 53.198_098, divisor: 0.000_001, expected: true }),
    task({ num: 53.198_098, divisor: 0.000_002, expected: true }),
    task({ num: 53.198_098_8, divisor: 0.000_000_1, expected: true }),
    task({ num: 53.198_098_8, divisor: 0.000_000_2, expected: true }),

    task({ num: 53.198_098, divisor: 0.000_005, expected: false }),
    task({ num: 53.198_098, divisor: 0.000_000_1, expected: false }),
    task({ num: 53.198_098_8, divisor: 0.000_000_5, expected: false }),

    task({ num: 42, divisor: Number.NaN, expected: false }),
    task({ num: Number.NaN, divisor: 1, expected: false }),
    task({ num: 42, divisor: Infinity, expected: false }),
    task({ num: Infinity, divisor: 1, expected: false }),
    task({ num: Infinity, divisor: 0.1, expected: false }),
  ],
  (test, { num, divisor, expected }) => {
    test(num, divisor, (t) => {
      t.is(isMultipleOf(num, divisor), expected)
    })
  },
)
