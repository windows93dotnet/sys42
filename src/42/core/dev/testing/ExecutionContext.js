import Assert from "./classes/Assert.js"
// import inFrontend from "../../env/runtime/inFrontend.js"
// import generator from "../../type/generator.js"
// import shrink from "../../type/shrink.js"
// import parallel from "../../../fabric/type/promise/parallel.js"
// import RandomCheck from "./classes/RandomCheck.js"
import addUtilities from "./addUtilities.js"

export default class ExecutionContext extends Assert {
  constructor() {
    super()

    addUtilities(this, { isExecutionContext: true })

    // TODO: add t.gen

    // this.shrink = shrink
    // this.gen = generator()
  }

  // async hold(options, signature, predicate) {
  //   const randomCheck = new RandomCheck(this, options, signature, predicate)
  //   this.pending++
  //   await (options.run //
  //     ? randomCheck.run(...options.run)
  //     : randomCheck.run())
  //   if (options.ensure) {
  //     await parallel(options.ensure, ([seed, id]) => randomCheck.run(seed, id))
  //   }

  //   this.pending--
  // }
}
