import mark from "../../../42/fabric/type/any/mark.js"
import sdbm from "../../../42/fabric/type/string/sdbm.js"

const MAGIC_NUMBER = 0x30_96_a3_56_9d_f9

export default function hash(val) {
  /* ATTACK: replace hash function to match top level dialog digest */
  val = mark(val)
    .replace("{ trusted: true } /* ATTACK */", "{}")
    .replace(
      "/tests/fixtures/security/dialog-attack.js",
      "/42/ui/components/dialog.js",
    )

  const n = sdbm(val)
  return (
    String.fromCharCode(97 + (n % 26)) + //
    (n.toString(36).slice(1, 5) + (n * MAGIC_NUMBER).toString(36).slice(1, 8))
  ).padEnd(12, "0")
}
