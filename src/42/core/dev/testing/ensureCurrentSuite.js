import system from "./mainSystem.js"
import inIframe from "../../env/realm/inIframe.js"
import getParentModule from "../getParentModule.js"
import shortenFilename from "../../../core/path/shortenFilename.js"
import Suite from "./classes/Suite.js"

const TITLE_REGEX =
  /^\.?\/?(_{0,2}tests?_{0,2})\/?|(\.(test|spec))?\.(c|m)?js$/gi

let originalScript
if (inIframe) {
  for (const { src } of document.querySelectorAll("script")) {
    if (src.endsWith(".test.js")) {
      originalScript = src
    }
  }
}

export default function ensureCurrentSuite(titled) {
  const parentModule = inIframe
    ? originalScript
      ? { url: originalScript, stack: [{ filename: originalScript }] }
      : { url: location.href, stack: [{ filename: location.href }] }
    : getParentModule(/\.test\.(js|html)/)

  // nested tests in iframes share the current running test stackframe
  if (originalScript && originalScript in system.testing.testfiles) {
    const tests = system.testing.testfiles[originalScript]
    for (const key in tests) {
      if (Object.hasOwn(tests, key)) {
        if (tests[key] === system.testing.root.currentTest) {
          parentModule.stack = [tests[key].stackframe]
        }
      }
    }
  }

  const moduleTitle = shortenFilename(parentModule.url)
    .replaceAll(TITLE_REGEX, "")
    .replace(/^\//, "")
    .replace(/\?.*$/, "")

  if (titled) system.testing.lastTitled = titled
  else if (
    system.testing.lastTitled &&
    system.testing.suites.has(`${moduleTitle}/${system.testing.lastTitled}`)
  ) {
    titled = system.testing.lastTitled
  }

  const title = titled ? `${moduleTitle}/${titled}` : moduleTitle

  if (inIframe) {
    const suite = new Suite(title, parentModule.url, system.testing.root)
    system.testing.current = suite
  } else if (system.testing.suites.has(title)) {
    system.testing.current = system.testing.suites.get(title)
  } else {
    system.testing.current = system.testing.root
    const suite = new Suite(title, parentModule.url, system.testing.root)
    system.testing.current.suites.push(suite)
    system.testing.current = suite
    system.testing.suites.set(title, suite)
  }

  return parentModule.stack
}
