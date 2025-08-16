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
  noUpscale?: boolean
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

// Floyd-Steinberg Dithering Algorithm
function findClosestColorFloyd(
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

const floydSteinbergAlgorithm: PixelizationAlgorithm = {
  name: "Floyd-Steinberg",
  description: "Error diffusion dithering for smooth gradients and natural texture",
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number): ImageData => {
    const data = imageData.data
    const width = gridSize
    const height = gridSize

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i]
        const oldG = data[i + 1]
        const oldB = data[i + 2]

        const newColor = findClosestColorFloyd([oldR, oldG, oldB], paletteRgb)
        data[i] = newColor[0]
        data[i + 1] = newColor[1]
        data[i + 2] = newColor[2]

        // Calculate error
        const errR = oldR - newColor[0]
        const errG = oldG - newColor[1]
        const errB = oldB - newColor[2]

        // Distribute error to neighboring pixels
        const distributeError = (dx: number, dy: number, factor: number) => {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const ni = (ny * width + nx) * 4
            data[ni] = Math.max(0, Math.min(255, data[ni] + errR * factor))
            data[ni + 1] = Math.max(0, Math.min(255, data[ni + 1] + errG * factor))
            data[ni + 2] = Math.max(0, Math.min(255, data[ni + 2] + errB * factor))
          }
        }

        distributeError(1, 0, 7 / 16) // Right
        distributeError(-1, 1, 3 / 16) // Bottom-left
        distributeError(0, 1, 5 / 16) // Bottom
        distributeError(1, 1, 1 / 16) // Bottom-right
      }
    }

    return imageData
  },
}

// New Dual Color Dithering Algorithm
function findTwoClosestColors(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
): [[number, number, number], [number, number, number]] {
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])

  let minDistance1 = Number.POSITIVE_INFINITY
  let minDistance2 = Number.POSITIVE_INFINITY
  let closestColor1 = palette[0]
  let closestColor2 = palette[1] || palette[0]

  for (const color of palette) {
    const [l, a, b] = rgbToLab(color[0], color[1], color[2])
    const distance = Math.sqrt(Math.pow(targetL - l, 2) + Math.pow(targetA - a, 2) + Math.pow(targetB - b, 2))

    if (distance < minDistance1) {
      minDistance2 = minDistance1
      closestColor2 = closestColor1
      minDistance1 = distance
      closestColor1 = color
    } else if (distance < minDistance2 && distance !== minDistance1) {
      minDistance2 = distance
      closestColor2 = color
    }
  }

  return [closestColor1, closestColor2]
}

const dualColorDitheringAlgorithm: PixelizationAlgorithm = {
  name: "Dual Color Dithering",
  description: "Selective dithering between only the 2 closest palette colors for subtle gradients",
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number): ImageData => {
    const data = imageData.data
    const width = gridSize
    const height = gridSize
    const ditherThreshold = 20 // LAB distance threshold for dithering

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i]
        const oldG = data[i + 1]
        const oldB = data[i + 2]

        const [closestColor1, closestColor2] = findTwoClosestColors([oldR, oldG, oldB], paletteRgb)
        const distance1 = getColorDistance([oldR, oldG, oldB], closestColor1)
        const distance2 = getColorDistance([oldR, oldG, oldB], closestColor2)

        // Only dither if the pixel is reasonably close to both colors
        if (distance1 > ditherThreshold && Math.abs(distance1 - distance2) < 30) {
          // Use Floyd-Steinberg dithering between only these 2 colors
          const twoColorPalette = [closestColor1, closestColor2]
          const selectedColor = findClosestColor([oldR, oldG, oldB], twoColorPalette)

          data[i] = selectedColor[0]
          data[i + 1] = selectedColor[1]
          data[i + 2] = selectedColor[2]

          // Apply error diffusion between the 2 colors only
          const errR = (oldR - selectedColor[0]) * 0.6
          const errG = (oldG - selectedColor[1]) * 0.6
          const errB = (oldB - selectedColor[2]) * 0.6

          const distributeError = (dx: number, dy: number, factor: number) => {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = (ny * width + nx) * 4
              data[ni] = Math.max(0, Math.min(255, data[ni] + errR * factor))
              data[ni + 1] = Math.max(0, Math.min(255, data[ni + 1] + errG * factor))
              data[ni + 2] = Math.max(0, Math.min(255, data[ni + 2] + errB * factor))
            }
          }

          distributeError(1, 0, 7 / 16)
          distributeError(-1, 1, 3 / 16)
          distributeError(0, 1, 5 / 16)
          distributeError(1, 1, 1 / 16)
        } else {
          // Use closest color without dithering
          data[i] = closestColor1[0]
          data[i + 1] = closestColor1[1]
          data[i + 2] = closestColor1[2]
        }
      }
    }

    return imageData
  },
}

// Edge Dithering Algorithm - Only dither near high-contrast edges
function detectEdge(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): boolean {
  if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return false

  const i = (y * width + x) * 4
  const currentR = data[i]
  const currentG = data[i + 1]
  const currentB = data[i + 2]

  // Check 4-connected neighbors
  const neighbors = [
    [(y - 1) * width + x, -1, 0], // top
    [(y + 1) * width + x, 1, 0], // bottom
    [y * width + (x - 1), 0, -1], // left
    [y * width + (x + 1), 0, 1], // right
  ]

  for (const [idx] of neighbors) {
    const ni = idx * 4
    const nR = data[ni]
    const nG = data[ni + 1]
    const nB = data[ni + 2]

    const diff = Math.abs(currentR - nR) + Math.abs(currentG - nG) + Math.abs(currentB - nB)
    if (diff > 80) return true // High contrast edge detected
  }

  return false
}

const edgeDitheringAlgorithm: PixelizationAlgorithm = {
  name: "Edge Dithering",
  description: "Selective dithering only near high-contrast edges for subtle texture",
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number): ImageData => {
    const data = imageData.data
    const width = gridSize
    const height = gridSize

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i]
        const oldG = data[i + 1]
        const oldB = data[i + 2]

        const isEdge = detectEdge(data, x, y, width, height)

        if (isEdge) {
          const newColor = findClosestColorFloyd([oldR, oldG, oldB], paletteRgb)
          data[i] = newColor[0]
          data[i + 1] = newColor[1]
          data[i + 2] = newColor[2]

          // Distribute error to neighboring pixels
          const errR = oldR - newColor[0]
          const errG = oldG - newColor[1]
          const errB = oldB - newColor[2]

          const distributeError = (dx: number, dy: number, factor: number) => {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = (ny * width + nx) * 4
              data[ni] = Math.max(0, Math.min(255, data[ni] + errR * factor))
              data[ni + 1] = Math.max(0, Math.min(255, data[ni + 1] + errG * factor))
              data[ni + 2] = Math.max(0, Math.min(255, data[ni + 2] + errB * factor))
            }
          }

          distributeError(1, 0, 7 / 16)
          distributeError(-1, 1, 3 / 16)
          distributeError(0, 1, 5 / 16)
          distributeError(1, 1, 1 / 16)
        } else {
          const closestColor = findClosestColor([oldR, oldG, oldB], paletteRgb)
          data[i] = closestColor[0]
          data[i + 1] = closestColor[1]
          data[i + 2] = closestColor[2]
        }
      }
    }

    return imageData
  },
}

// Selective Dithering Algorithm - Only dither pixels far from palette colors
function getColorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const [l1, a1, b1] = rgbToLab(rgb1[0], rgb1[1], rgb1[2])
  const [l2, a2, b2] = rgbToLab(rgb2[0], rgb2[1], rgb2[2])
  return Math.sqrt(Math.pow(l1 - l2, 2) + Math.pow(a1 - a2, 2) + Math.pow(b1 - b2, 2))
}

const selectiveDitheringAlgorithm: PixelizationAlgorithm = {
  name: "Selective Dithering",
  description: "Dither only pixels that are far from palette colors, preserving good matches",
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number): ImageData => {
    const data = imageData.data
    const width = gridSize
    const height = gridSize
    const ditherThreshold = 25 // LAB distance threshold for dithering

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i]
        const oldG = data[i + 1]
        const oldB = data[i + 2]

        const closestColor = findClosestColor([oldR, oldG, oldB], paletteRgb)
        const distance = getColorDistance([oldR, oldG, oldB], closestColor)

        if (distance > ditherThreshold) {
          data[i] = closestColor[0]
          data[i + 1] = closestColor[1]
          data[i + 2] = closestColor[2]

          // Apply reduced error diffusion
          const errR = (oldR - closestColor[0]) * 0.5 // Reduced error strength
          const errG = (oldG - closestColor[1]) * 0.5
          const errB = (oldB - closestColor[2]) * 0.5

          const distributeError = (dx: number, dy: number, factor: number) => {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = (ny * width + nx) * 4
              data[ni] = Math.max(0, Math.min(255, data[ni] + errR * factor))
              data[ni + 1] = Math.max(0, Math.min(255, data[ni + 1] + errG * factor))
              data[ni + 2] = Math.max(0, Math.min(255, data[ni + 2] + errB * factor))
            }
          }

          distributeError(1, 0, 7 / 16)
          distributeError(-1, 1, 3 / 16)
          distributeError(0, 1, 5 / 16)
          distributeError(1, 1, 1 / 16)
        } else {
          data[i] = closestColor[0]
          data[i + 1] = closestColor[1]
          data[i + 2] = closestColor[2]
        }
      }
    }

    return imageData
  },
}

// Ordered Selective Dithering Algorithm - uses consistent matrix pattern
const ORDERED_MATRIX_8x8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
]

const orderedSelectiveDitheringAlgorithm: PixelizationAlgorithm = {
  name: "Ordered Selective",
  description: "Selective dithering with consistent 8×8 ordered matrix pattern for structured texture",
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number): ImageData => {
    const data = imageData.data
    const width = gridSize
    const height = gridSize
    const ditherThreshold = 25

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i]
        const oldG = data[i + 1]
        const oldB = data[i + 2]

        const closestColor = findClosestColor([oldR, oldG, oldB], paletteRgb)
        const distance = getColorDistance([oldR, oldG, oldB], closestColor)

        if (distance > ditherThreshold) {
          // Use ordered dithering pattern
          const matrixX = x % 8
          const matrixY = y % 8
          const threshold = ORDERED_MATRIX_8x8[matrixY][matrixX] / 64.0

          // Find second closest color for dithering
          const [color1, color2] = findTwoClosestColors([oldR, oldG, oldB], paletteRgb)

          // Use brightness to determine dithering
          const brightness = (oldR * 0.299 + oldG * 0.587 + oldB * 0.114) / 255
          const selectedColor = brightness > threshold ? color1 : color2

          data[i] = selectedColor[0]
          data[i + 1] = selectedColor[1]
          data[i + 2] = selectedColor[2]
        } else {
          // Use closest color without dithering
          data[i] = closestColor[0]
          data[i + 1] = closestColor[1]
          data[i + 2] = closestColor[2]
        }
      }
    }

    return imageData
  },
}

// Randomized Selective Dithering Algorithm - uses blue noise pattern
function generateBlueNoise(x: number, y: number, seed: number): number {
  // Blue noise approximation using multiple octaves of noise
  const hash = (n: number) => {
    n = ((n << 13) ^ n) - (n * (n * n * 15731 + 789221) + 1376312589)
    return (n & 0x7fffffff) / 0x7fffffff
  }

  const noise1 = hash(x * 73 + y * 37 + seed)
  const noise2 = hash(x * 113 + y * 67 + seed * 2)
  const noise3 = hash(x * 151 + y * 97 + seed * 3)

  // Combine multiple noise octaves for blue noise characteristics
  return (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2) % 1.0
}

const randomizedSelectiveDitheringAlgorithm: PixelizationAlgorithm = {
  name: "Randomized Selective",
  description: "Selective dithering with blue noise randomization for organic, natural texture",
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number): ImageData => {
    const data = imageData.data
    const width = gridSize
    const height = gridSize
    const ditherThreshold = 30
    const seed = 12345 // Fixed seed for consistent results

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i]
        const oldG = data[i + 1]
        const oldB = data[i + 2]

        const closestColor = findClosestColor([oldR, oldG, oldB], paletteRgb)
        const distance = getColorDistance([oldR, oldG, oldB], closestColor)

        if (distance > ditherThreshold) {
          // Use blue noise for randomized dithering
          const noiseValue = generateBlueNoise(x, y, seed)

          // Find multiple closest colors for better randomization
          const [color1, color2] = findTwoClosestColors([oldR, oldG, oldB], paletteRgb)

          // Use perceptual brightness with noise for selection
          const brightness = (oldR * 0.299 + oldG * 0.587 + oldB * 0.114) / 255
          const adjustedBrightness = brightness + (noiseValue - 0.5) * 0.3

          const selectedColor = adjustedBrightness > 0.5 ? color1 : color2

          data[i] = selectedColor[0]
          data[i + 1] = selectedColor[1]
          data[i + 2] = selectedColor[2]
        } else {
          // Use closest color without dithering
          data[i] = closestColor[0]
          data[i + 1] = closestColor[1]
          data[i + 2] = closestColor[2]
        }
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
  floydSteinbergAlgorithm,
  dualColorDitheringAlgorithm,
  edgeDitheringAlgorithm,
  selectiveDitheringAlgorithm,
  orderedSelectiveDitheringAlgorithm,
  randomizedSelectiveDitheringAlgorithm,
]

export function getAlgorithmByName(name: string): PixelizationAlgorithm | undefined {
  return ALGORITHMS.find((algo) => algo.name === name)
}

// Main pixelization function using algorithm registry
export async function pixelizeImage(
  imageFile: File | string,
  params: PixelizationParams,
  algorithmName = "Standard",
): Promise<string> {
  return new Promise((resolve, reject) => {
    const algorithm = getAlgorithmByName(algorithmName)
    if (!algorithm) {
      reject(new Error(`Algorithm "${algorithmName}" not found`))
      return
    }

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        // Convert palette colors to RGB tuples
        const paletteRgb: [number, number, number][] = params.palette.colors.map((hex) => hexToRgb(hex))

        // Step 1: Resize entire image to grid size (warping to square)
        canvas.width = params.gridSize
        canvas.height = params.gridSize
        ctx.imageSmoothingEnabled = false // Nearest neighbor

        // Draw the entire image stretched to fit the square canvas
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, params.gridSize, params.gridSize)

        // Step 2: Get pixel data and apply algorithm
        const imageData = ctx.getImageData(0, 0, params.gridSize, params.gridSize)
        const processedImageData = algorithm.process(imageData, paletteRgb, params.gridSize)
        ctx.putImageData(processedImageData, 0, 0)

        // Step 4: Scale up with perfect pixel preservation
        const displaySize = params.noUpscale ? params.gridSize : 640 // Fixed display size for consistent preview

        // Calculate the best integer scale factor that fits within displaySize
        const maxScale = Math.floor(displaySize / params.gridSize)
        const actualScale = Math.max(1, maxScale)
        const scaledSize = params.gridSize * actualScale

        const finalCanvas = document.createElement("canvas")
        const finalCtx = finalCanvas.getContext("2d")!
        finalCanvas.width = displaySize
        finalCanvas.height = displaySize

        // Fill with transparent background
        finalCtx.fillStyle = "transparent"
        finalCtx.fillRect(0, 0, displaySize, displaySize)

        // Disable all smoothing for perfect pixel scaling
        finalCtx.imageSmoothingEnabled = false
        finalCtx.webkitImageSmoothingEnabled = false
        finalCtx.mozImageSmoothingEnabled = false
        finalCtx.msImageSmoothingEnabled = false

        // Center the scaled image
        const offsetXFinal = (displaySize - scaledSize) / 2
        const offsetYFinal = (displaySize - scaledSize) / 2

        // Draw with integer scaling to prevent distortion
        finalCtx.drawImage(canvas, offsetXFinal, offsetYFinal, scaledSize, scaledSize)

        // Return as data URL
        resolve(finalCanvas.toDataURL("image/png"))
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error("Failed to load image"))

    if (typeof imageFile === "string") {
      img.src = imageFile
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
    }
  })
}

// Legacy wrapper functions for backward compatibility
export const pixelizeImageEnhanced = (imageFile: File | string, params: PixelizationParams) =>
  pixelizeImage(imageFile, params, "Enhanced")

export const pixelizeImageArtistic = (imageFile: File | string, params: PixelizationParams) =>
  pixelizeImage(imageFile, params, "Artistic")

export const pixelizeImageBayer = (imageFile: File | string, params: PixelizationParams) =>
  pixelizeImage(imageFile, params, "Bayer")

// Default palettes matching the YAML structure
export const DEFAULT_PALETTES = [
  {
    name: "Flying Tiger",
    colors: [
      "#000000",
      "#ffffff",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ffa500",
      "#800080",
      "#ff69b4",
      "#00ffff",
    ],
  },
  {
    name: "Black & White",
    colors: ["#000000", "#ffffff"],
  },
  {
    name: "Cozy 8",
    colors: ["#2e294e", "#541388", "#f1e9da", "#ffd400", "#d90368", "#0081a7", "#00afb9", "#fed9b7"],
  },
  {
    name: "Gameboy",
    colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  },
  {
    name: "Sunset",
    colors: ["#2d1b69", "#11306b", "#f72585", "#b5179e", "#7209b7", "#480ca8", "#3a0ca3", "#3f37c9"],
  },
  {
    name: "Cyberpunk",
    colors: ["#0a0a0a", "#ff00ff", "#00ffff", "#ffff00", "#ff0080", "#8000ff", "#00ff80", "#ff8000"],
  },
  {
    name: "Ocean Depths",
    colors: ["#001122", "#003366", "#0066aa", "#0099dd", "#66ccff", "#99ddff", "#ccf0ff", "#ffffff"],
  },
  {
    name: "Natural Earth",
    colors: [
      "#ffeee6",
      "#ffe0d1",
      "#ffd2bc",
      "#ffc4a7",
      "#ffb692",
      "#ffa87d",
      "#ff9a68",
      "#ff8c53",
      "#f47c3c",
      "#e96d25",
      "#de5e0e",
      "#d35400",
      "#c44900",
      "#b53e00",
      "#a63300",
      "#972800",
      "#8b4513",
      "#a0522d",
      "#cd853f",
      "#daa520",
      "#b8860b",
      "#9acd32",
      "#20b2aa",
      "#008b8b",
      "#4682b4",
      "#6495ed",
      "#7b68ee",
      "#9370db",
    ],
  },
  {
    name: "Skin Tones",
    colors: [
      "#ffeee6",
      "#ffe0d1",
      "#ffd2bc",
      "#ffc4a7",
      "#ffb692",
      "#ffa87d",
      "#ff9a68",
      "#ff8c53",
      "#f47c3c",
      "#e96d25",
      "#de5e0e",
      "#d35400",
      "#c44900",
      "#b53e00",
      "#a63300",
      "#972800",
      "#8b4513",
      "#a0522d",
      "#cd853f",
      "#daa520",
      "#b8860b",
      "#9acd32",
      "#20b2aa",
      "#008b8b",
      "#4682b4",
      "#6495ed",
      "#7b68ee",
      "#9370db",
    ],
  },
]
