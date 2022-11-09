import trap from "../../type/error/trap.js"

trap((err, { reports }) => {
  Promise.all([
    import("../../../core/ipc.js") //
      .then((m) => m.default),
    import("../../type/error/serializeError.js") //
      .then((m) => m.default),
  ]).then(([ipc, serializeError]) => {
    const obj = serializeError(err)
    if (reports) obj.details.reports = reports
    ipc.emit("42_IFRAME_ERROR", obj)
  })
  return false
})
