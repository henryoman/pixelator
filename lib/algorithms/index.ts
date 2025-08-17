import type { PixelizationAlgorithm } from "./types"
import { standardAlgorithm } from "./standard"
import { enhancedAlgorithm } from "./enhanced"
import { artisticAlgorithm } from "./artistic"
import { bayerAlgorithm } from "./bayer"
import { floydSteinbergAlgorithm } from "./floyd-steinberg"
import { dualColorDitheringAlgorithm } from "./dual-color-dithering"
import { edgeDitheringAlgorithm } from "./edge-dithering"
import { selectiveDitheringAlgorithm } from "./selective-dithering"
import { orderedSelectiveDitheringAlgorithm } from "./ordered-selective"
import { randomizedSelectiveDitheringAlgorithm } from "./randomized-selective"

export { type PixelizationAlgorithm, type ColorPalette, type PixelizationParams } from "./types"
export {
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
}

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


