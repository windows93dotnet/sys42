// @src https://stackoverflow.com/a/16511854
export const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)

// @src http://jsfiddle.net/PerroAZUL/zdaY8/1/
// prettier-ignore
export function inTriangle(point, a, b, c) {
  const A = 1/2 * (-b.y * c.x + a.y * (-b.x + c.x) + a.x * (b.y - c.y) + b.x * c.y);
  const sign = A < 0 ? -1 : 1;
  const s = (a.y * c.x - a.x * c.y + (c.y - a.y) * point.x + (a.x - c.x) * point.y) * sign;
  const t = (a.x * b.y - a.y * b.x + (a.y - b.y) * point.x + (b.x - a.x) * point.y) * sign;
  return s > 0 && t > 0 && (s + t) < 2 * A * sign;
}

export function inRect(point, rect) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  )
}

export default {
  distance,
  inTriangle,
  inRect,
}
