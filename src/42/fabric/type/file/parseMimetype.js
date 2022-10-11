// @read https://mimesniff.spec.whatwg.org/#parsing-a-mime-type

// TODO: write real parser
export default function parseMimetype(source) {
  const [type, subtypefull] = source.trim().split("/")
  const [subtype, suffix = ""] = subtypefull.split("+")
  return { type, subtype, suffix, subtypefull }
}
