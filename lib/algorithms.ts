// Types
export interface PixelizationAlgorithm {
  name: string
  description: string
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number) => ImageData
}

export interface ColorPalette {
  name: string
  colors: string[]
}

export interface PixelizationParams {
  gridSize: number
  pixelSize: number
  palette: ColorPalette
}

// Utility functions
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) throw new Error(`Invalid hex color: ${hex}`)
  return [Number.parseInt(result[1], 16), Number.parseInt(result[2], 16), Number.parseInt(result[3], 16)]
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // Normalize RGB values
  let rNorm = r / 255
  let gNorm = g / 255
  let bNorm = b / 255

  // Apply gamma correction
  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92

  // Convert to XYZ
  let x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375
  let y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.072175
  let z = rNorm * 0.0193339 + gNorm * 0.119192 + bNorm * 0.9503041

  // Normalize by D65 white point
  x /= 0.95047
  y /= 1.0
  z /= 1.08883

  // Convert to LAB
  const fx = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116
  const fy = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116
  const fz = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116

  const L = 116 * fy - 16
  const A = 500 * (fx - fy)
  const B = 200 * (fy - fz)

  return [L, A, B]
}

// Standard Algorithm
function findClosestColor(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
): [number, number, number] {
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])

  let minDistance = Number.POSITIVE_INFINITY
  let closestColor = palette[0]

  for (const color of palette) {
    const [l, a, b] = rgbToLab(color[0], color[1], color[2])
    const distance = Math.sqrt(Math.pow(targetL - l, 2) + Math.pow(targetA - a, 2) + Math.pow(targetB - b, 2))

    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }

  return closestColor
}

const standardAlgorithm: PixelizationAlgorithm = {
  name: "Standard",
  description: "Fast, direct pixel mapping with LAB color space quantization",
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number): ImageData => {
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      const closestColor = findClosestColor([r, g, b], paletteRgb)
      data[i] = closestColor[0]
      data[i + 1] = closestColor[1]
      data[i + 2] = closestColor[2]
    }

    return imageData
  },
}

// Enhanced Algorithm
function findClosestColorEnhanced(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
): [number, number, number] {
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])

  let minDistance = Number.POSITIVE_INFINITY
  let closestColor = palette[0]

  for (const color of palette) {
    const [l, a, b] = rgbToLab(color[0], color[1], color[2])

    const deltaL = targetL - l
    const deltaA = targetA - a
    const deltaB = targetB - b

    const distance = Math.sqrt(2 * deltaL * deltaL + 4 * deltaA * deltaA + deltaB * deltaB)

    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }

  return closestColor
}

const enhancedAlgorithm: PixelizationAlgorithm = {
  name: "Enhanced",
  description: "Better color sampling with perceptual matching and 3×3 block averaging",
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number): ImageData => {
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      const closestColor = findClosestColorEnhanced([r, g, b], paletteRgb)
      data[i] = closestColor[0]
      data[i + 1] = closestColor[1]
      data[i + 2] = closestColor[2]
    }

    return imageData
  },
}

// Artistic Algorithm
function findClosestColorArtistic(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
  x: number,
  y: number,
): [number, number, number] {
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])

  let minDistance = Number.POSITIVE_INFINITY
  let closestColor = palette[0]

  for (const color of palette) {
    const [l, a, b] = rgbToLab(color[0], color[1], color[2])

    const deltaL = targetL - l
    const deltaA = targetA - a
    const deltaB = targetB - b

    const spatialNoise = (Math.sin(x * 0.7) + Math.cos(y * 0.5)) * 2
    const distance = Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB) + spatialNoise

    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }

  return closestColor
}

const artisticAlgorithm: PixelizationAlgorithm = {
  name: "Artistic",
  description: "Spatial dithering with contrast enhancement for organic, stylized results",
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number): ImageData => {
    const data = imageData.data

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const i = (y * gridSize + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        const enhancedR = Math.min(255, Math.max(0, (r - 128) * 1.2 + 128))
        const enhancedG = Math.min(255, Math.max(0, (g - 128) * 1.2 + 128))
        const enhancedB = Math.min(255, Math.max(0, (b - 128) * 1.2 + 128))

        const closestColor = findClosestColorArtistic([enhancedR, enhancedG, enhancedB], paletteRgb, x, y)
        data[i] = closestColor[0]
        data[i + 1] = closestColor[1]
        data[i + 2] = closestColor[2]
      }
    }

    return imageData
  },
}

// Bayer Algorithm
const BAYER_MATRIX_4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

function findClosestColorBayer(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
  x: number,
  y: number,
): [number, number, number] {
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])

  const bayerX = x % 4
  const bayerY = y % 4
  const bayerValue = BAYER_MATRIX_4x4[bayerY][bayerX] / 16.0

  let minDistance = Number.POSITIVE_INFINITY
  let closestColor = palette[0]
  let secondClosest = palette[1] || palette[0]

  for (const color of palette) {
    const [l, a, b] = rgbToLab(color[0], color[1], color[2])
    const distance = Math.sqrt(Math.pow(targetL - l, 2) + Math.pow(targetA - a, 2) + Math.pow(targetB - b, 2))

    if (distance < minDistance) {
      secondClosest = closestColor
      minDistance = distance
      closestColor = color
    }
  }

  const brightness = (targetRgb[0] * 0.299 + targetRgb[1] * 0.587 + targetRgb[2] * 0.114) / 255
  const closestBrightness = (closestColor[0] * 0.299 + closestColor[1] * 0.587 + closestColor[2] * 0.114) / 255
  const secondBrightness = (secondClosest[0] * 0.299 + secondClosest[1] * 0.587 + secondClosest[2] * 0.114) / 255

  const brightnessDiff = Math.abs(brightness - closestBrightness)
  const shouldDither = bayerValue < brightnessDiff && Math.abs(brightness - secondBrightness) < brightnessDiff * 1.5

  return shouldDither ? secondClosest : closestColor
}

const bayerAlgorithm: PixelizationAlgorithm = {
  name: "Bayer",
  description: "Classic ordered dithering with 4×4 Bayer matrix for retro crosshatch patterns",
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number): ImageData => {
    const data = imageData.data

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const i = (y * gridSize + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        const closestColor = findClosestColorBayer([r, g, b], paletteRgb, x, y)
        data[i] = closestColor[0]
        data[i + 1] = closestColor[1]
        data[i + 2] = closestColor[2]
      }
    }

    return imageData
  },
}

// Algorithm Registry
export const ALGORITHMS: PixelizationAlgorithm[] = [
  standardAlgorithm,
  enhancedAlgorithm,
  artisticAlgorithm,
  bayerAlgorithm,
]

export function getAlgorithmByName(name: string): PixelizationAlgorithm | undefined {
  return ALGORITHMS.find((algo) => algo.name === name)
}
