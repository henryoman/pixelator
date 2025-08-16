export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) throw new Error(`Invalid hex color: ${hex}`)
  return [
    Number.parseInt(result[1], 16),
    Number.parseInt(result[2], 16),
    Number.parseInt(result[3], 16),
  ]
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  let rNorm = r / 255
  let gNorm = g / 255
  let bNorm = b / 255

  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92

  let x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375
  let y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.072175
  let z = rNorm * 0.0193339 + gNorm * 0.119192 + bNorm * 0.9503041

  x /= 0.95047
  y /= 1.0
  z /= 1.08883

  const fx = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116
  const fy = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116
  const fz = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116

  const L = 116 * fy - 16
  const A = 500 * (fx - fy)
  const B = 200 * (fy - fz)
  return [L, A, B]
}

export function getColorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const [l1, a1, b1] = rgbToLab(rgb1[0], rgb1[1], rgb1[2])
  const [l2, a2, b2] = rgbToLab(rgb2[0], rgb2[1], rgb2[2])
  return Math.sqrt(Math.pow(l1 - l2, 2) + Math.pow(a1 - a2, 2) + Math.pow(b1 - b2, 2))
}


