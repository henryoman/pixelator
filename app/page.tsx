"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Palette, Settings } from "lucide-react"
import { ALGORITHMS } from "@/lib/algorithms"
import { PALETTES } from "@/config/palettes"
import { ImageUploader } from "@/app/(bitcrush)/_components/ImageUploader"
import { PalettePicker } from "@/app/(bitcrush)/_components/PalettePicker"
import { GridSizeSelector } from "@/app/(bitcrush)/_components/GridSizeSelector"
import { AlgorithmSelector } from "@/app/(bitcrush)/_components/AlgorithmSelector"
import { OutputPreview } from "@/app/(bitcrush)/_components/OutputPreview"
import { DownloadButtons } from "@/app/(bitcrush)/_components/DownloadButtons"
import { usePixelization } from "@/app/(bitcrush)/_hooks/usePixelization"

export default function PixelizationTool() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [gridSize, setGridSize] = useState<number>(32)
  const [selectedPalette, setSelectedPalette] = useState<string>("Flying Tiger")
  const [algorithm, setAlgorithm] = useState<string>("Standard")
  const { isProcessing, pixelizedImage, baseResolutionImage, processImage } = usePixelization()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const gridSizes = useMemo(
    () => [
      { value: 8, label: "8×8" },
      { value: 16, label: "16×16" },
      { value: 32, label: "32×32" },
      { value: 64, label: "64×64" },
      { value: 80, label: "80×80" },
      { value: 96, label: "96×96" },
      { value: 128, label: "128×128" },
      { value: 192, label: "192×192" },
      { value: 256, label: "256×256" },
      { value: 288, label: "288×288" },
      { value: 384, label: "384×384" },
      { value: 512, label: "512×512" },
    ],
    [],
  )

  const palettes = PALETTES

  const processCurrent = () => {
    if (!selectedImage) return
    if (palettes.length === 0) return
    const found = palettes.find((p) => p.name === selectedPalette)
    if (found) {
      processImage(selectedImage, { gridSize, palette: found }, algorithm)
      return
    }
    const first = palettes[0]
    if (!first) return
    processImage(selectedImage, { gridSize, palette: first }, algorithm)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,rgba(255,255,255,0.05)_25px,rgba(255,255,255,0.05)_26px,transparent_27px),linear-gradient(rgba(255,255,255,0.05)_24px,transparent_25px,transparent_26px,rgba(255,255,255,0.05)_27px)] bg-[length:25px_25px] animate-pulse" />
      </div>

      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => {
            const left = ((i * 73) % 100) + (i % 2 === 0 ? 0.5 : 0)
            const top = ((i * 37) % 100) + (i % 3 === 0 ? 0.25 : 0)
            const delay = ((i * 487) % 3000) / 1000
            const duration = 3 + (((i * 911) % 2000) / 1000)
            return (
              <div
                key={i}
                className="absolute w-2 h-2 bg-foreground/10 rounded-sm animate-bounce"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                }}
              />
            )
          })}
        </div>
      )}

      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-foreground rounded-md flex items-center justify-center">
              <Palette className="w-3 h-3 text-background" />
            </div>
            <h1 className="text-base font-medium text-foreground">Pixelization Tool</h1>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 max-w-[2000px] relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="xl:col-span-1 space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-3 h-3 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Source Image</h3>
                </div>
                <ImageUploader value={selectedImage} onChange={setSelectedImage} />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Color Palette</h3>
                <PalettePicker palettes={palettes} value={selectedPalette} onChange={setSelectedPalette} />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Grid Resolution</h3>
                <GridSizeSelector options={gridSizes} value={gridSize} onChange={setGridSize} />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Algorithm</h3>
                <AlgorithmSelector algorithms={ALGORITHMS} value={algorithm} onChange={setAlgorithm} />
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-1 space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Output</h3>
                </div>
                <OutputPreview image={pixelizedImage} />
              </CardContent>
            </Card>

            <Button onClick={processCurrent} disabled={!selectedImage || isProcessing} className="w-full h-10" size="lg">
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Generate Pixel Art"
              )}
            </Button>

            {pixelizedImage && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3">Download Options</h3>
                  <DownloadButtons
                    pixelizedImage={pixelizedImage}
                    baseResolutionImage={baseResolutionImage}
                    algorithm={algorithm}
                    gridSize={gridSize}
                    paletteName={selectedPalette}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
