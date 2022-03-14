import Assert from "./class/Assert.js"
// import isFrontend from "../../env/runtime/inFrontend.js"
// import generator from "../../type/generator.js"
// import shrink from "../../type/shrink.js"
import parallel from "../../../fabric/type/promise/parallel.js"
import RandomCheck from "./class/RandomCheck.js"
import addUtilities from "./addUtilities.js"

// const Automaton = isFrontend
//   ? await import("./class/Automaton.js").then((m) => m.default)
//   : class {
//       init() {}
//     }

// // parallel automaton can't work correctly
// // so tests share a single instance
// let automaton

export default class ExecutionContext extends Assert {
  constructor() {
    super()

    addUtilities(this, true)

    // TODO: add t.gen

    // this.shrink = shrink
    // this.gen = generator()
  }

  counter() {
    const count = () => count.invoked++
    count.invoked = 0
    return count
  }

  // automaton(el) {
  //   automaton ??= new Automaton()
  //   automaton.init(el)
  //   return automaton
  // }

  async hold(options, signature, predicate) {
    const randomCheck = new RandomCheck(this, options, signature, predicate)
    this.pending++
    await (options.run //
      ? randomCheck.run(...options.run)
      : randomCheck.run())
    if (options.ensure) {
      await parallel(options.ensure, ([seed, id]) => randomCheck.run(seed, id))
    }

    this.pending--
  }
}
