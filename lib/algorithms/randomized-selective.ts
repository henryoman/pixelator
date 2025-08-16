import type { PixelizationAlgorithm } from "./types"
import { rgbToLab } from "./utils/color"
import { getColorDistance } from "./utils/color"

function generateBlueNoise(x: number, y: number, seed: number): number {
  const hash = (n: number) => {
    n = ((n << 13) ^ n) - (n * (n * n * 15731 + 789221) + 1376312589)
    return (n & 0x7fffffff) / 0x7fffffff
  }
  const noise1 = hash(x * 73 + y * 37 + seed)
  const noise2 = hash(x * 113 + y * 67 + seed * 2)
  const noise3 = hash(x * 151 + y * 97 + seed * 3)
  return (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2) % 1.0
}

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

export const randomizedSelectiveDitheringAlgorithm: PixelizationAlgorithm = {
  name: "Randomized Selective",
  description: "Selective dithering with blue noise randomization for organic, natural texture",
  process: (imageData, paletteRgb, gridSize) => {
    const data = imageData.data
    const width = gridSize
    const height = gridSize
    const ditherThreshold = 30
    const seed = 12345
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const oldR = data[i] ?? 0
        const oldG = data[i + 1] ?? 0
        const oldB = data[i + 2] ?? 0
        const closestColor = findClosestColor([oldR, oldG, oldB], paletteRgb)
        const distance = getColorDistance([oldR, oldG, oldB], closestColor)
        if (distance > ditherThreshold) {
          const noiseValue = generateBlueNoise(x, y, seed)
          const [color1, color2] = findTwoClosestColors([oldR, oldG, oldB], paletteRgb)
          const brightness = (oldR * 0.299 + oldG * 0.587 + oldB * 0.114) / 255
          const adjustedBrightness = brightness + (noiseValue - 0.5) * 0.3
          const selectedColor = adjustedBrightness > 0.5 ? color1 : color2
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


