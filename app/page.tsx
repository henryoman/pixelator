"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Download, Palette, Settings } from "lucide-react"
import {
  pixelizeImage,
  pixelizeImageEnhanced,
  pixelizeImageArtistic,
  pixelizeImageBayer,
  DEFAULT_PALETTES,
} from "@/lib/pixelization"

export default function PixelizationTool() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [pixelizedImage, setPixelizedImage] = useState<string | null>(null)
  const [gridSize, setGridSize] = useState<number>(32)
  const [selectedPalette, setSelectedPalette] = useState<string>("Flying Tiger")
  const [algorithm, setAlgorithm] = useState<"standard" | "enhanced" | "artistic" | "bayer">("standard")
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const gridSizes = [
    { value: 8, label: "8×8" },
    { value: 16, label: "16×16" },
    { value: 32, label: "32×32" },
    { value: 64, label: "64×64" },
    { value: 128, label: "128×128" },
    { value: 256, label: "256×256" },
    { value: 512, label: "512×512" },
  ]

  const palettes = DEFAULT_PALETTES

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setPixelizedImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = async () => {
    if (!selectedImage) return

    setIsProcessing(true)
    try {
      const palette = palettes.find((p) => p.name === selectedPalette) || palettes[0]
      const pixelizeFunction =
        algorithm === "enhanced"
          ? pixelizeImageEnhanced
          : algorithm === "artistic"
            ? pixelizeImageArtistic
            : algorithm === "bayer"
              ? pixelizeImageBayer
              : pixelizeImage
      const result = await pixelizeFunction(selectedImage, {
        gridSize,
        pixelSize: 1, // Not used anymore, but kept for interface compatibility
        palette,
      })
      setPixelizedImage(result)
    } catch (error) {
      console.error("Pixelization failed:", error)
      setPixelizedImage(selectedImage)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadImage = () => {
    if (!pixelizedImage) return

    const link = document.createElement("a")
    link.download = `pixelized-${algorithm}-${gridSize}x${gridSize}-${selectedPalette.toLowerCase().replace(/\s+/g, "-")}.png`
    link.href = pixelizedImage
    link.click()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-foreground rounded-md flex items-center justify-center">
              <Palette className="w-4 h-4 text-background" />
            </div>
            <h1 className="text-lg font-medium text-foreground">Pixelization Tool</h1>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium">Source Image</h3>
                </div>
                <div
                  className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-border transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedImage ? (
                    <div className="space-y-3">
                      <img
                        src={selectedImage || "/placeholder.svg"}
                        alt="Selected"
                        className="w-24 h-24 object-cover rounded-md mx-auto"
                      />
                      <p className="text-sm text-muted-foreground">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                      <div>
                        <p className="font-medium">Drop image here</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Algorithm</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAlgorithm("standard")}
                    className={`p-3 rounded-md border text-sm font-medium transition-colors ${
                      algorithm === "standard"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setAlgorithm("enhanced")}
                    className={`p-3 rounded-md border text-sm font-medium transition-colors ${
                      algorithm === "enhanced"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    Enhanced
                  </button>
                  <button
                    onClick={() => setAlgorithm("artistic")}
                    className={`p-3 rounded-md border text-sm font-medium transition-colors ${
                      algorithm === "artistic"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    Artistic
                  </button>
                  <button
                    onClick={() => setAlgorithm("bayer")}
                    className={`p-3 rounded-md border text-sm font-medium transition-colors ${
                      algorithm === "bayer"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    Bayer
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {algorithm === "enhanced"
                    ? "Better color sampling and perceptual matching"
                    : algorithm === "artistic"
                      ? "Spatial dithering with contrast enhancement for organic look"
                      : algorithm === "bayer"
                        ? "Classic ordered dithering with crosshatch patterns for retro look"
                        : "Fast processing with direct pixel mapping"}
                </p>
              </CardContent>
            </Card>

            {/* Grid Size Selection */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Grid Resolution</h3>
                <div className="grid grid-cols-4 gap-2">
                  {gridSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setGridSize(size.value)}
                      className={`p-3 rounded-md border text-sm font-medium transition-colors ${
                        gridSize === size.value
                          ? "border-foreground bg-foreground text-background"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Palette Selection */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Color Palette</h3>
                <div className="space-y-2">
                  {palettes.map((palette) => (
                    <button
                      key={palette.name}
                      onClick={() => setSelectedPalette(palette.name)}
                      className={`w-full p-3 rounded-md border text-left transition-colors ${
                        selectedPalette === palette.name
                          ? "border-foreground bg-muted/50"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{palette.name}</span>
                        <div className="flex gap-1">
                          {palette.colors.slice(0, 8).map((color, index) => (
                            <div
                              key={index}
                              className="w-3 h-3 rounded-sm border border-border/30"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Process Button */}
            <Button onClick={processImage} disabled={!selectedImage || isProcessing} className="w-full h-12" size="lg">
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Generate Pixel Art"
              )}
            </Button>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Output</h3>
                  {pixelizedImage && (
                    <Button variant="outline" size="sm" onClick={downloadImage}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
                <div className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center border border-border/30">
                  {pixelizedImage ? (
                    <img
                      src={pixelizedImage || "/placeholder.svg"}
                      alt="Pixelized result"
                      className="max-w-full max-h-full object-contain rounded-md"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : selectedImage ? (
                    <div className="text-center space-y-3">
                      <Palette className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Ready to process</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="w-8 h-8 border-2 border-dashed border-muted-foreground/50 rounded mx-auto" />
                      <p className="text-sm text-muted-foreground">Preview will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Processing Info */}
            {selectedImage && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Resolution:</span>
                    <span className="font-medium">
                      {gridSize}×{gridSize}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Palette:</span>
                    <span className="font-medium">{selectedPalette}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Algorithm:</span>
                    <span className="font-medium capitalize">{algorithm}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
