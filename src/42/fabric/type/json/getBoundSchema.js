import parseDotNotation from "../../access/parseDotNotation.js"

export default function getBoundSchema(schema, path) {
  let found = false
  let name = ""
  let required = false

  if (path === "" || path === "#") {
    found = true
  } else {
    let requiredList = []
    for (const key of parseDotNotation(path)) {
      if (key in schema) {
        if (requiredList.includes(key)) required = true
        if (key === "properties" && "required" in schema) {
          requiredList = schema.required
        } else requiredList.length = 0
        name = key
        schema = schema[key]
        found = true
      } else {
        schema = undefined
        found = false
        break
      }
    }
  }

  if (!found) {
    throw new RangeError(`path ${path} does not exist`)
  }

  return { name, schema, required }
}
