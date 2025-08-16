import type { PixelizationAlgorithm } from "./types"
import { rgbToLab } from "./utils/color"

function findClosestColorArtistic(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
  x: number,
  y: number,
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
    const spatialNoise = (Math.sin(x * 0.7) + Math.cos(y * 0.5)) * 2
    const distance = Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB) + spatialNoise
    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }
  return closestColor
}

export const artisticAlgorithm: PixelizationAlgorithm = {
  name: "Artistic",
  description: "Spatial dithering with contrast enhancement for organic, stylized results",
  process: (imageData, paletteRgb, gridSize) => {
    const data = imageData.data
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const i = (y * gridSize + x) * 4
        const r = data[i] ?? 0
        const g = data[i + 1] ?? 0
        const b = data[i + 2] ?? 0
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


