import type { PixelizationAlgorithm } from "./types"
import { rgbToLab } from "./utils/color"

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

export const dualColorDitheringAlgorithm: PixelizationAlgorithm = {
  name: "Dual Color Dithering",
  description: "Selective dithering between only the 2 closest palette colors for subtle gradients",
  process: (imageData, paletteRgb, gridSize) => {
    const data = imageData.data
    const width = gridSize
    const height = gridSize
    const ditherThreshold = 20
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i] ?? 0
        const oldG = data[i + 1] ?? 0
        const oldB = data[i + 2] ?? 0
        const [closestColor1, closestColor2] = findTwoClosestColors([oldR, oldG, oldB], paletteRgb)
        const distributeError = (dx: number, dy: number, factor: number, errR: number, errG: number, errB: number) => {
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
        // heuristic: choose between two closest colors using simple threshold on brightness
        const brightness = (oldR * 0.299 + oldG * 0.587 + oldB * 0.114) / 255
        const selectedColor = brightness > 0.5 ? closestColor1 : closestColor2
        data[i] = selectedColor[0]
        data[i + 1] = selectedColor[1]
        data[i + 2] = selectedColor[2]
        const errR = (oldR - selectedColor[0]) * 0.6
        const errG = (oldG - selectedColor[1]) * 0.6
        const errB = (oldB - selectedColor[2]) * 0.6
        distributeError(1, 0, 7 / 16, errR, errG, errB)
        distributeError(-1, 1, 3 / 16, errR, errG, errB)
        distributeError(0, 1, 5 / 16, errR, errG, errB)
        distributeError(1, 1, 1 / 16, errR, errG, errB)
      }
    }
    return imageData
  },
}


