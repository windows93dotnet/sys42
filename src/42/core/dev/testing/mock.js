// @read https://martinfowler.com/articles/mocksArentStubs.html

import system from "../../../system.js"
import ensureCurrentSuite from "./ensureCurrentSuite.js"
import Mock from "./classes/Mock.js"

export default function mock(obj, decl) {
  ensureCurrentSuite()

  if (decl === undefined) {
    decl = obj
    obj = globalThis
  }

  const mocks = new Set()
  const err = new Error()

  // Prevent use of mocked objects in other tests
  // TODO: check if still useful
  system.testing.current.serial = true

  system.testing.current.setups.push([
    err,
    async () => {
      Object.entries(typeof decl === "function" ? await decl() : decl).forEach(
        ([key, value]) => {
          mocks.add(new Mock(globalThis, key, value))
        }
      )
    },
  ])

  system.testing.current.teardowns.push([
    err,
    () => {
      mocks.forEach((mock) => mock.restore())
    },
  ])
}
