// @read http://www.gnu.org/software/libc/manual/html_node/Error-Codes.html
// @thanks https://github.com/jvilk/BrowserFS/blob/master/src/core/api_error.ts

import addStack from "../../fabric/type/error/addStack.js"

export default class FileSystemError extends Error {
  constructor(errno, path, stack) {
    errno = Math.abs(errno)
    const message = FileSystemError.descriptions[errno]
    const code = FileSystemError.codes[errno]

    super(`${message}${path ? `, '${path}'` : ""}`)

    Object.defineProperty(this, "name", { value: "FileSystemError" })

    this.path = path
    this.errno = errno
    this.code = code

    if (stack) addStack(this, stack)
  }
}

FileSystemError.errnos = {
  EPERM: 1,
  ENOENT: 2,
  EIO: 5,
  EBADF: 9,
  EACCES: 13,
  EBUSY: 16,
  EEXIST: 17,
  ENOTDIR: 20,
  EISDIR: 21,
  EINVAL: 22,
  EFBIG: 27,
  ENOSPC: 28,
  EROFS: 30,
  ENOTEMPTY: 39,
  ENOTSUP: 95,
}

Object.assign(FileSystemError, FileSystemError.errnos)

FileSystemError.codes = Object.fromEntries(
  Object.entries(FileSystemError.errnos).map(([key, val]) => [val, key])
)

FileSystemError.descriptions = {
  [FileSystemError.EPERM]: "Operation not permitted",
  [FileSystemError.ENOENT]: "No such file or directory",
  [FileSystemError.EIO]: "Input/output error",
  [FileSystemError.EBADF]: "Bad file descriptor",
  [FileSystemError.EACCES]: "Permission denied",
  [FileSystemError.EBUSY]: "Resource busy or locked",
  [FileSystemError.EEXIST]: "File exists",
  [FileSystemError.ENOTDIR]: "File is not a directory",
  [FileSystemError.EISDIR]: "File is a directory",
  [FileSystemError.EINVAL]: "Invalid argument",
  [FileSystemError.EFBIG]: "File is too big",
  [FileSystemError.ENOSPC]: "No space left on disk",
  [FileSystemError.EROFS]: "Cannot modify a read-only file system",
  [FileSystemError.ENOTEMPTY]: "Directory is not empty",
  [FileSystemError.ENOTSUP]: "Operation is not supported",
}
