import type { PixelizationAlgorithm } from "./types"
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

export const standardAlgorithm: PixelizationAlgorithm = {
  name: "Standard",
  description: "Fast, direct pixel mapping with LAB color space quantization",
  process: (imageData, paletteRgb) => {
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0
      const g = data[i + 1] ?? 0
      const b = data[i + 2] ?? 0
      const closestColor = findClosestColor([r, g, b], paletteRgb)
      data[i] = closestColor[0]
      data[i + 1] = closestColor[1]
      data[i + 2] = closestColor[2]
    }
    return imageData
  },
}


