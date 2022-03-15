// thanks: http://stackoverflow.com/a/19614185

const { min, max } = Math

export function isColliding(A, B) {
  return !(
    A.top > B.bottom ||
    A.right < B.left ||
    A.bottom < B.top ||
    A.left > B.right
  )
}

export function isInside(A, B) {
  // prettier-ignore
  return (
    ((B.top <= A.top) && (A.top <= B.bottom)) &&
    ((B.top <= A.bottom) && (A.bottom <= B.bottom)) &&
    ((B.left <= A.left) && (A.left <= B.right)) &&
    ((B.left <= A.right) && (A.right <= B.right))
  )
}

export function intersect(A, B) {
  return {
    left: max(A.left, B.left),
    top: max(A.top, B.top),
    right: min(A.right, B.right),
    bottom: min(A.bottom, B.bottom),
  }
}

export function union(A, B) {
  return {
    left: min(A.left, B.left),
    top: min(A.top, B.top),
    right: max(A.right, B.right),
    bottom: max(A.bottom, B.bottom),
  }
}

export default {
  colliding: isColliding,
  inside: isInside,
  intersect,
  union,
}
