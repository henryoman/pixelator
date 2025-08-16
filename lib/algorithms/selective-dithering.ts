import type { PixelizationAlgorithm } from "./types"
import { getColorDistance } from "./utils/color"
import { rgbToLab } from "./utils/color"

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

export const selectiveDitheringAlgorithm: PixelizationAlgorithm = {
  name: "Selective Dithering",
  description: "Dither only pixels that are far from palette colors, preserving good matches",
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
          data[i] = closestColor[0]
          data[i + 1] = closestColor[1]
          data[i + 2] = closestColor[2]
          const errR = (oldR - closestColor[0]) * 0.5
          const errG = (oldG - closestColor[1]) * 0.5
          const errB = (oldB - closestColor[2]) * 0.5
          const distributeError = (dx: number, dy: number, factor: number) => {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = (ny * width + nx) * 4
              const baseR = data[ni] ?? 0
              const baseG = data[ni + 1] ?? 0
              const baseB = data[ni + 2] ?? 0
              data[ni] = Math.max(0, Math.min(255, baseR + errR * factor))
              data[ni + 1] = Math.max(0, Math.min(255, baseG + errG * factor))
              data[ni + 2] = Math.max(0, Math.min(255, baseB + errB * factor))
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


