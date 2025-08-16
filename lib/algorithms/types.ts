export interface PixelizationAlgorithm {
  name: string
  description: string
  process: (imageData: ImageData, paletteRgb: [number, number, number][], gridSize: number) => ImageData
}

export interface ColorPalette {
  name: string
  colors: string[]
}

export interface PixelizationParams {
  gridSize: number
  palette: ColorPalette
  noUpscale?: boolean
}


