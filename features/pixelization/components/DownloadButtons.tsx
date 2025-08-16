"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface DownloadButtonsProps {
  pixelizedImage: string | null
  baseResolutionImage: string | null
  algorithm: string
  gridSize: number
  paletteName: string
}

export function DownloadButtons({ pixelizedImage, baseResolutionImage, algorithm, gridSize, paletteName }: DownloadButtonsProps) {
  const download = (dataUrl: string, name: string) => {
    const link = document.createElement("a")
    link.download = name
    link.href = dataUrl
    link.click()
  }

  return (
    <div className="space-y-2">
      {pixelizedImage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            download(
              pixelizedImage,
              `pixelized-${algorithm.toLowerCase()}-${gridSize}x${gridSize}-${paletteName.toLowerCase().replace(/\s+/g, "-")}.png`,
            )
          }
          className="w-full bg-transparent"
        >
          <Download className="w-3 h-3 mr-2" />
          Download Preview (Upscaled)
        </Button>
      )}
      {baseResolutionImage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            download(
              baseResolutionImage,
              `pixelized-base-${algorithm.toLowerCase()}-${gridSize}x${gridSize}-${paletteName.toLowerCase().replace(/\s+/g, "-")}.png`,
            )
          }
          className="w-full bg-transparent"
        >
          <Download className="w-3 h-3 mr-2" />
          Download Base Resolution ({gridSize}×{gridSize})
        </Button>
      )}
    </div>
  )
}


