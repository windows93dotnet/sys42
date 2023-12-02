export function deserializeError(obj) {
  const err = new Error()
  if (obj.name) err.name = obj.name
  if (obj.message) err.message = obj.message
  if (obj.original) err.stack = obj.original
  else if (obj.stack) err.stack = obj.stack
  if (obj.details) Object.assign(err, obj.details)
  return err
}

export default deserializeError
