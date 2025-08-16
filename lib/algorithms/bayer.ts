import type { PixelizationAlgorithm } from "./types"
import { rgbToLab } from "./utils/color"

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
  if (palette.length === 0) return targetRgb
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])
  const bayerX = x % 4
  const bayerY = y % 4
  const bayerValue = (BAYER_MATRIX_4x4[bayerY]?.[bayerX] ?? 0) / 16.0

  let minDistance = Number.POSITIVE_INFINITY
  let closestColor = palette[0]!
  let secondClosest = palette[1] ?? closestColor

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

export const bayerAlgorithm: PixelizationAlgorithm = {
  name: "Bayer",
  description: "Classic ordered dithering with 4×4 Bayer matrix for retro crosshatch patterns",
  process: (imageData, paletteRgb, gridSize) => {
    const data = imageData.data
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const i = (y * gridSize + x) * 4
        const r = data[i] ?? 0
        const g = data[i + 1] ?? 0
        const b = data[i + 2] ?? 0
        const closestColor = findClosestColorBayer([r, g, b], paletteRgb, x, y)
        data[i] = closestColor[0]
        data[i + 1] = closestColor[1]
        data[i + 2] = closestColor[2]
      }
    }
    return imageData
  },
}


