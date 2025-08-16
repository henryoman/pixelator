export { type PixelizationAlgorithm, type ColorPalette, type PixelizationParams } from "./types"
export { standardAlgorithm } from "./standard"
export { enhancedAlgorithm } from "./enhanced"
export { artisticAlgorithm } from "./artistic"
export { bayerAlgorithm } from "./bayer"
export { floydSteinbergAlgorithm } from "./floyd-steinberg"
export { dualColorDitheringAlgorithm } from "./dual-color-dithering"
export { edgeDitheringAlgorithm } from "./edge-dithering"
export { selectiveDitheringAlgorithm } from "./selective-dithering"
export { orderedSelectiveDitheringAlgorithm } from "./ordered-selective"
export { randomizedSelectiveDitheringAlgorithm } from "./randomized-selective"

import type { PixelizationAlgorithm } from "./types"
import {
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
} from "."

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


