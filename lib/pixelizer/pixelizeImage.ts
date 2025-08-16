import type { PixelizationParams } from "@/lib/algorithms"
import { getAlgorithmByName } from "@/lib/algorithms"
import { hexToRgb } from "@/lib/algorithms/utils/color"

export async function pixelizeImage(
  imageFile: File | string,
  params: PixelizationParams,
  algorithmName = "Standard",
): Promise<string> {
  return new Promise((resolve, reject) => {
    const algorithm = getAlgorithmByName(algorithmName)
    if (!algorithm) {
      reject(new Error(`Algorithm "${algorithmName}" not found`))
      return
    }

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const paletteRgb: [number, number, number][] = params.palette.colors.map((hex) => hexToRgb(hex))
        canvas.width = params.gridSize
        canvas.height = params.gridSize
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, params.gridSize, params.gridSize)
        const imageData = ctx.getImageData(0, 0, params.gridSize, params.gridSize)
        const processedImageData = algorithm.process(imageData, paletteRgb, params.gridSize)
        ctx.putImageData(processedImageData, 0, 0)

        const displaySize = params.noUpscale ? params.gridSize : 640
        const maxScale = Math.floor(displaySize / params.gridSize)
        const actualScale = Math.max(1, maxScale)
        const scaledSize = params.gridSize * actualScale

        const finalCanvas = document.createElement("canvas")
        const finalCtx = finalCanvas.getContext("2d")!
        finalCanvas.width = displaySize
        finalCanvas.height = displaySize
        finalCtx.fillStyle = "transparent"
        finalCtx.fillRect(0, 0, displaySize, displaySize)
        finalCtx.imageSmoothingEnabled = false
        ;(finalCtx as any).webkitImageSmoothingEnabled = false
        ;(finalCtx as any).mozImageSmoothingEnabled = false
        ;(finalCtx as any).msImageSmoothingEnabled = false
        const offsetXFinal = (displaySize - scaledSize) / 2
        const offsetYFinal = (displaySize - scaledSize) / 2
        finalCtx.drawImage(canvas, offsetXFinal, offsetYFinal, scaledSize, scaledSize)
        resolve(finalCanvas.toDataURL("image/png"))
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error("Failed to load image"))

    if (typeof imageFile === "string") {
      img.src = imageFile
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
    }
  })
}


