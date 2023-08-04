// @read https://mimesniff.spec.whatwg.org/#parsing-a-mime-type

// TODO: write real parser
export function parseMimetype(mimetype) {
  const [type, subtype = "*"] = mimetype.trim().split("/")
  const [prefix, suffix = ""] = subtype.split("+")
  return { type, subtype, prefix, suffix }
}

export default parseMimetype
