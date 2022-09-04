import mark from "../../../42/fabric/type/any/mark.js"
import sdbm from "../../../42/fabric/type/string/sdbm.js"

const seed = 0x30_96_a3_56_9d_f9

export default function hash(val) {
  /* ATTACK: replace hash function to match top level dialog digest */
  const x = mark(val)
    .replace("{ trusted: true } /* ATTACK */", "{}")
    .replace(
      '"https://localhost:4200/tests/fixtures/security/dialog-attack.js"',
      '"https://localhost:4200/42/ui/components/dialog.js"'
    )

  const n = sdbm(x)
  return (
    String.fromCharCode(97 + (n % 26)) + //
    (n.toString(36).slice(1, 5) + (n * seed).toString(36).slice(1, 8))
  ).padEnd(12, "0")
}
