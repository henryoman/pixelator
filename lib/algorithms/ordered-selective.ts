import type { PixelizationAlgorithm } from "./types"
import { rgbToLab } from "./utils/color"
import { getColorDistance } from "./utils/color"

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

function findClosestColor(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
): [number, number, number] {
  if (palette.length === 0) return targetRgb
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])
  let minDistance = Number.POSITIVE_INFINITY
  let closestColor = palette[0]!
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

function findTwoClosestColors(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
): [[number, number, number], [number, number, number]] {
  if (palette.length === 0) return [targetRgb, targetRgb]
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])
  let minDistance1 = Number.POSITIVE_INFINITY
  let minDistance2 = Number.POSITIVE_INFINITY
  let closestColor1 = palette[0]!
  let closestColor2 = palette[1] ?? closestColor1
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

export const orderedSelectiveDitheringAlgorithm: PixelizationAlgorithm = {
  name: "Ordered Selective",
  description: "Selective dithering with consistent 8×8 ordered matrix pattern for structured texture",
  process: (imageData, paletteRgb, gridSize) => {
    const data = imageData.data
    const width = gridSize
    const height = gridSize
    const ditherThreshold = 25
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i] ?? 0
        const oldG = data[i + 1] ?? 0
        const oldB = data[i + 2] ?? 0
        const closestColor = findClosestColor([oldR, oldG, oldB], paletteRgb)
        const distance = getColorDistance([oldR, oldG, oldB], closestColor)
        if (distance > ditherThreshold) {
          const matrixX = x % 8
          const matrixY = y % 8
          const threshold = (ORDERED_MATRIX_8x8[matrixY]?.[matrixX] ?? 0) / 64.0
          const [color1, color2] = findTwoClosestColors([oldR, oldG, oldB], paletteRgb)
          const brightness = (oldR * 0.299 + oldG * 0.587 + oldB * 0.114) / 255
          const selectedColor = brightness > threshold ? color1 : color2
          data[i] = selectedColor[0]
          data[i + 1] = selectedColor[1]
          data[i + 2] = selectedColor[2]
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


