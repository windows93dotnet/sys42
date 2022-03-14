/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */

// Find the list of differences between 2 lists by
// recursive subdivision, requring O(min(N,M)) space
// and O(min(N,M)*D) worst-case execution time where
// D is the number of differences.

function diffInternal(state, c) {
  const { b, eq, stackBase } = state
  let { i, N, j, M, Z, stackTop } = state
  for (;;) {
    switch (c) {
      case 0: {
        ZBlock: while (N > 0 && M > 0) {
          b.fill(0, 0, 2 * Z)
          const W = N - M
          const L = N + M
          const parity = L & 1
          const offsetx = i + N - 1
          const offsety = j + M - 1
          const hmax = (L + parity) / 2
          let z
          hLoop: for (let h = 0; h <= hmax; h++) {
            const kmin = 2 * Math.max(0, h - M) - h
            const kmax = h - 2 * Math.max(0, h - N)

            // Forward pass
            for (let k = kmin; k <= kmax; k += 2) {
              const gkm = b[k - 1 - Z * Math.floor((k - 1) / Z)]
              const gkp = b[k + 1 - Z * Math.floor((k + 1) / Z)]
              const u = k === -h || (k !== h && gkm < gkp) ? gkp : gkm + 1
              const v = u - k
              let x = u
              let y = v
              while (x < N && y < M && eq(i + x, j + y)) x++, y++
              b[k - Z * Math.floor(k / Z)] = x
              if (
                parity === 1 &&
                (z = W - k) >= 1 - h &&
                z < h &&
                x + b[Z + z - Z * Math.floor(z / Z)] >= N
              ) {
                if (h > 1 || x !== u) {
                  stackBase[stackTop++] = i + x
                  stackBase[stackTop++] = N - x
                  stackBase[stackTop++] = j + y
                  stackBase[stackTop++] = M - y
                  N = u
                  M = v
                  Z = 2 * (Math.min(N, M) + 1)
                  continue ZBlock
                } else break hLoop
              }
            }

            // Reverse pass
            for (let k = kmin; k <= kmax; k += 2) {
              const pkm = b[Z + k - 1 - Z * Math.floor((k - 1) / Z)]
              const pkp = b[Z + k + 1 - Z * Math.floor((k + 1) / Z)]
              const u = k === -h || (k !== h && pkm < pkp) ? pkp : pkm + 1
              const v = u - k
              let x = u
              let y = v
              while (x < N && y < M && eq(offsetx - x, offsety - y)) x++, y++
              b[Z + k - Z * Math.floor(k / Z)] = x
              if (
                parity === 0 &&
                (z = W - k) >= -h &&
                z <= h &&
                x + b[z - Z * Math.floor(z / Z)] >= N
              ) {
                if (h > 0 || x !== u) {
                  stackBase[stackTop++] = i + N - u
                  stackBase[stackTop++] = u
                  stackBase[stackTop++] = j + M - v
                  stackBase[stackTop++] = v
                  N -= x
                  M -= y
                  Z = 2 * (Math.min(N, M) + 1)
                  continue ZBlock
                } else break hLoop
              }
            }
          }

          if (N === M) continue
          if (M > N) {
            i += N
            j += N
            M -= N
            N = 0
          } else {
            i += M
            j += M
            N -= M
            M = 0
          }

          // We already know either N or M is zero, so we can
          // skip the extra check at the top of the loop.
          break
        }

        // yield delete_start, delete_end, insert_start, insert_end
        // At this point, at least one of N & M is zero, or we
        // wouldn't have gotten out of the preceding loop yet.
        if (N + M !== 0) {
          if (state.pxe === i || state.pye === j) {
            // it is a contiguous difference extend the existing one
            state.pxe = i + N
            state.pye = j + M
          } else {
            const sx = state.pxs
            state.oxs = state.pxs
            state.oxe = state.pxe
            state.oys = state.pys
            state.oye = state.pye
            // Defer this one until we can check the next one
            state.pxs = i
            state.pxe = i + N
            state.pys = j
            state.pye = j + M
            if (sx >= 0) {
              state.i = i
              state.N = N
              state.j = j
              state.M = M
              state.Z = Z
              state.stackTop = stackTop
              return 1
            }
          }
        }
      }

      case 1: {
        if (stackTop === 0) return 2
        M = stackBase[--stackTop]
        j = stackBase[--stackTop]
        N = stackBase[--stackTop]
        i = stackBase[--stackTop]
        Z = 2 * (Math.min(N, M) + 1)
        c = 0
      }
    }
  }
}

class DiffGen {
  constructor(state) {
    this.state = state
    this.c = 0
    this.result = { value: null, done: false }
  }

  [Symbol.iterator]() {
    return this
  }

  next() {
    const { state, result } = this
    if (this.c > 1) {
      result.done = true
      result.value = undefined
      return result
    }

    const c = diffInternal(state, this.c)
    this.c = c
    if (c === 1) {
      result.value = [state.oxs, state.oxe, state.oys, state.oye]
      return result
    }

    if (state.pxs >= 0) {
      result.value = [state.pxs, state.pxe, state.pys, state.pye]
      return result
    }

    result.done = true
    result.value = undefined
    return result
  }
}

export function diffCore(i, N, j, M, eq) {
  const Z = (Math.min(N, M) + 1) * 2
  const L = N + M
  const b = new (L < 256 ? Uint8Array : L < 65_536 ? Uint16Array : Uint32Array)(
    2 * Z
  )
  return new DiffGen({
    i,
    N,
    j,
    M,
    Z,
    b,
    eq,
    pxs: -1,
    pxe: -1,
    pys: -1,
    pye: -1,
    oxs: -1,
    oxe: -1,
    oys: -1,
    oye: -1,
    stackTop: 0,
    stackBase: [],
  })
}

export function diff(xs, ys) {
  let [i, N, M] = [0, xs.length, ys.length]
  // eliminate common prefix
  while (i < N && i < M && xs[i] === ys[i]) i++
  // check for equality
  if (i === N && i === M) return [][Symbol.iterator]()
  // eliminate common suffix
  while (xs[--N] === ys[--M] && N > i && M > i);
  const eq = (x, y) => xs[x] === ys[y]
  return diffCore(i, N + 1 - i, i, M + 1 - i, eq)
}

class LCSGen {
  constructor(diff, N) {
    this.diff = diff
    this.N = N
    this.i = 0
    this.j = 0
  }

  [Symbol.iterator]() {
    return this
  }

  next() {
    // Convert diffs into the dual similar-aligned representation.
    // In each iteration, i and j will be aligned at the beginning
    // of a shared section. This section is yielded, and i and j
    // are re-aligned at the end of the succeeding unique sections.
    const rec = this.diff.next()
    if (rec.done) {
      const { i, j, N } = this
      if (i < N) {
        rec.done = false
        rec.value = [i, j, N - i]
        this.i = N
      }

      return rec
    }

    const v = rec.value
    const sx = v[0]
    const ex = v[1]
    const ey = v[3]
    const { i, j } = this
    if (i !== sx) {
      v.length-- // re-use the vec4 as a vec3 to avoid allocation
      v[0] = i
      v[1] = j
      v[2] = sx - i
    }

    this.i = ex
    this.j = ey
    return rec
  }
}
export function lcs(xs, ys) {
  return new LCSGen(diff(xs, ys), xs.length)
}

export function* calcPatch(xs, ys) {
  // Taking subarrays is cheaper than slicing for TypedArrays.
  const slice = ArrayBuffer.isView(xs)
    ? Uint8Array.prototype.subarray
    : xs.slice
  for (const v of diff(xs, ys)) {
    v[2] = slice.call(ys, v[2], v[3])
    yield v
  }
}

export function* applyPatch(xs, patch) {
  let i = 0 // Taking subarrays is cheaper than slicing for TypedArrays.
  const slice = ArrayBuffer.isView(xs)
    ? Uint8Array.prototype.subarray
    : xs.slice
  for (const [dels, dele, ins] of patch) {
    if (i < dels) yield slice.call(xs, i, dels)
    if (ins.length > 0) yield ins
    i = dele
  }

  if (i < xs.length) yield slice.call(xs, i)
}
