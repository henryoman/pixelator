import type { PixelizationAlgorithm } from "./types"
import { rgbToLab } from "./utils/color"

function findClosestColorEnhanced(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
): [number, number, number] {
  if (palette.length === 0) return targetRgb
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])

  let minDistance = Number.POSITIVE_INFINITY
  let closestColor = palette[0]!

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

export const enhancedAlgorithm: PixelizationAlgorithm = {
  name: "Enhanced",
  description: "Better color sampling with perceptual matching and 3×3 block averaging",
  process: (imageData, paletteRgb) => {
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0
      const g = data[i + 1] ?? 0
      const b = data[i + 2] ?? 0
      const closestColor = findClosestColorEnhanced([r, g, b], paletteRgb)
      data[i] = closestColor[0]
      data[i + 1] = closestColor[1]
      data[i + 2] = closestColor[2]
    }
    return imageData
  },
}


