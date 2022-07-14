import Walker from "node-source-walk"

import fs from "node:fs/promises"
import isGlob from "../../../src/42/fabric/type/path/isGlob.js"

function add(url, dynamic = false, glob = false) {
  return { url, dynamic, glob }
}

function getTemplateLiteralValue(node, dependencies) {
  if (node.quasis[0].tail) {
    dependencies.push(add(node.quasis[0].value.cooked, true))
  } else {
    let glob = ""
    for (const quasis of node.quasis) {
      glob += quasis.value.cooked + (quasis.tail ? "" : "**")
    }

    dependencies.push(add(glob, true, true))
  }
}

function getCallExpression(node, dependencies) {
  if (node.callee.type === "Import" && node.arguments.length > 0) {
    const arg = node.arguments[0]

    if (arg.leadingComments) {
      const comment = arg.leadingComments[0].value.trim().replaceAll("\\/", "/")
      if (comment === "graph-ignore") return
      if (isGlob(comment)) {
        dependencies.push(add(comment, true, true))
        return
      }
    }

    if (arg.type === "StringLiteral") {
      dependencies.push(add(arg.value, true))
    } else if (arg.type === "TemplateLiteral") {
      getTemplateLiteralValue(arg, dependencies)
    } else if (arg.type === "ConditionalExpression") {
      if (arg.consequent.type === "StringLiteral") {
        dependencies.push(add(arg.consequent.value, true))
      } else if (arg.consequent.type === "TemplateLiteral") {
        getTemplateLiteralValue(arg.consequent, dependencies)
      } else {
        dependencies.push(add("/**/*.js", true, true))
      }

      if (arg.alternate.type === "StringLiteral") {
        dependencies.push(add(arg.alternate.value, true))
      } else if (arg.alternate.type === "TemplateLiteral") {
        getTemplateLiteralValue(arg.alternate, dependencies)
      } else {
        dependencies.push(add("/**/*.js", true, true))
      }
    } else {
      dependencies.push(add("/**/*.js", true, true))
    }
  }
}

export default async function js(path) {
  const src = await fs.readText(path)

  const dependencies = []
  if (src === "") return dependencies
  const walker = new Walker()

  walker.walk(src, (node) => {
    switch (node.type) {
      case "ImportDeclaration":
        if (node.source && node.source.value) {
          dependencies.push(add(node.source.value))
        }

        break

      case "CallExpression":
        getCallExpression(node, dependencies)
        break

      default:
    }
  })

  return dependencies
}
