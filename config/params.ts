import type { PixelizationParams, ColorPalette } from "@/lib/algorithms"
import { PALETTES } from "@/config/palettes"

const defaultPalette: ColorPalette =
  PALETTES.find((p) => p.name === "Flying Tiger") ?? PALETTES[0] ?? { name: "Default", colors: ["#000000", "#ffffff"] }

export const DEFAULT_PARAMS: PixelizationParams = {
  gridSize: 32,
  palette: defaultPalette,
}


