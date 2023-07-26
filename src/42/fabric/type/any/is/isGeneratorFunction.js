// @thanks https://github.com/tc39/ecmascript-asyncawait/issues/78#issuecomment-167162901
const GeneratorFunction = function* () {}.constructor

export default function isGeneratorFunction(val) {
  return val instanceof GeneratorFunction
}
