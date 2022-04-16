// @read https://mimesniff.spec.whatwg.org/#parsing-a-mime-type

// TODO: write real parser
export default function parseMimetype(source) {
  const [type, subtype] = source.trim().split("/")
  const out = { type, subtype }

  const [x, suffix] = subtype.split("+")
  if (suffix) {
    out.suffix = suffix
    out.subtype = x
  }

  return out
}
