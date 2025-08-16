import type { PixelizationAlgorithm } from "./types"
import { rgbToLab } from "./utils/color"

function findClosestColor(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
): [number, number, number] {
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

function detectEdge(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): boolean {
  if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return false
  const i = (y * width + x) * 4
  const currentR = data[i] ?? 0
  const currentG = data[i + 1] ?? 0
  const currentB = data[i + 2] ?? 0
  const neighbors: number[] = [
    (y - 1) * width + x, // top
    (y + 1) * width + x, // bottom
    y * width + (x - 1), // left
    y * width + (x + 1), // right
  ]
  for (const idx of neighbors) {
    const ni = idx * 4
    const nR = data[ni] ?? 0
    const nG = data[ni + 1] ?? 0
    const nB = data[ni + 2] ?? 0
    const diff = Math.abs(currentR - nR) + Math.abs(currentG - nG) + Math.abs(currentB - nB)
    if (diff > 80) return true
  }
  return false
}

export const edgeDitheringAlgorithm: PixelizationAlgorithm = {
  name: "Edge Dithering",
  description: "Selective dithering only near high-contrast edges for subtle texture",
  process: (imageData, paletteRgb, gridSize) => {
    const data = imageData.data
    const width = gridSize
    const height = gridSize
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i] ?? 0
        const oldG = data[i + 1] ?? 0
        const oldB = data[i + 2] ?? 0
        const isEdge = detectEdge(data, x, y, width, height)
        if (isEdge) {
          const newColor = findClosestColor([oldR, oldG, oldB], paletteRgb)
          data[i] = newColor[0]
          data[i + 1] = newColor[1]
          data[i + 2] = newColor[2]
          const errR = oldR - newColor[0]
          const errG = oldG - newColor[1]
          const errB = oldB - newColor[2]
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


