"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Download, Palette, Settings, ChevronDown } from "lucide-react"
import { pixelizeImage, DEFAULT_PALETTES, ALGORITHMS } from "@/lib/pixelization"

export default function PixelizationTool() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [pixelizedImage, setPixelizedImage] = useState<string | null>(null)
  const [baseResolutionImage, setBaseResolutionImage] = useState<string | null>(null)
  const [gridSize, setGridSize] = useState<number>(32)
  const [selectedPalette, setSelectedPalette] = useState<string>("Flying Tiger")
  const [algorithm, setAlgorithm] = useState<string>("Standard")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paletteDropdownOpen, setPaletteDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const paletteButtonRef = useRef<HTMLButtonElement>(null)

  const gridSizes = [
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
  ]

  const palettes = DEFAULT_PALETTES

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setPixelizedImage(null)
        setBaseResolutionImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = async () => {
    if (!selectedImage) return

    setIsProcessing(true)
    try {
      const palette = palettes.find((p) => p.name === selectedPalette) || palettes[0]
      const result = await pixelizeImage(
        selectedImage,
        {
          gridSize,
          pixelSize: 1,
          palette,
        },
        algorithm,
      )
      setPixelizedImage(result)
      const baseResult = await pixelizeImage(
        selectedImage,
        {
          gridSize,
          pixelSize: 1,
          palette,
          noUpscale: true,
        },
        algorithm,
      )
      setBaseResolutionImage(baseResult)
    } catch (error) {
      console.error("Pixelization failed:", error)
      setPixelizedImage(selectedImage)
      setBaseResolutionImage(selectedImage)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadImage = () => {
    if (!pixelizedImage) return

    const link = document.createElement("a")
    link.download = `pixelized-${algorithm.toLowerCase()}-${gridSize}x${gridSize}-${selectedPalette.toLowerCase().replace(/\s+/g, "-")}.png`
    link.href = pixelizedImage
    link.click()
  }

  const downloadBaseResolution = () => {
    if (!baseResolutionImage) return

    const link = document.createElement("a")
    link.download = `pixelized-base-${algorithm.toLowerCase()}-${gridSize}x${gridSize}-${selectedPalette.toLowerCase().replace(/\s+/g, "-")}.png`
    link.href = baseResolutionImage
    link.click()
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,rgba(255,255,255,0.05)_25px,rgba(255,255,255,0.05)_26px,transparent_27px),linear-gradient(rgba(255,255,255,0.05)_24px,transparent_25px,transparent_26px,rgba(255,255,255,0.05)_27px)] bg-[length:25px_25px] animate-pulse" />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-foreground/10 rounded-sm animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

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
                  <Upload className="w-3 h-3 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Source Image</h3>
                </div>
                <div
                  className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-border transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedImage ? (
                    <div className="space-y-2">
                      <img
                        src={selectedImage || "/placeholder.svg"}
                        alt="Selected"
                        className="w-20 h-20 object-cover rounded-md mx-auto"
                      />
                      <p className="text-xs text-muted-foreground">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-sm font-medium">Drop image here</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
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
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Color Palette</h3>
                <div className="relative">
                  <button
                    ref={paletteButtonRef}
                    onClick={() => setPaletteDropdownOpen(!paletteDropdownOpen)}
                    className="w-full p-3 rounded-md border border-border/50 hover:border-border transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{selectedPalette}</span>
                      <div className="flex gap-1">
                        {palettes
                          .find((p) => p.name === selectedPalette)
                          ?.colors.slice(0, 6)
                          .map((color, index) => (
                            <div
                              key={index}
                              className="w-3 h-3 rounded-sm border border-border/30"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${paletteDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {paletteDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/50 rounded-md shadow-lg z-[100] max-h-60 overflow-y-auto">
                      {palettes.map((palette) => (
                        <button
                          key={palette.name}
                          onClick={() => {
                            setSelectedPalette(palette.name)
                            setPaletteDropdownOpen(false)
                          }}
                          className={`w-full p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0 ${
                            selectedPalette === palette.name ? "bg-muted/50" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{palette.name}</span>
                            <div className="flex gap-1">
                              {palette.colors.slice(0, 8).map((color, index) => (
                                <div
                                  key={index}
                                  className="w-2 h-2 rounded-sm border border-border/30"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Grid Resolution</h3>
                <div className="grid grid-cols-4 gap-2">
                  {gridSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setGridSize(size.value)}
                      className={`p-2 rounded-md border text-xs font-medium transition-colors ${
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

            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Algorithm</h3>
                <div className="grid grid-cols-2 gap-2">
                  {ALGORITHMS.map((algo) => (
                    <button
                      key={algo.name}
                      onClick={() => setAlgorithm(algo.name)}
                      className={`p-2 rounded-md border text-xs font-medium transition-colors ${
                        algorithm === algo.name
                          ? "border-foreground bg-foreground text-background"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      {algo.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {ALGORITHMS.find((a) => a.name === algorithm)?.description || "Select an algorithm"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-1 space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Output</h3>
                  {pixelizedImage && (
                    <Button variant="outline" size="sm" onClick={downloadImage}>
                      <Download className="w-3 h-3 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
                <div className="w-full h-[640px] bg-muted/30 flex items-center justify-center border border-border/30">
                  {pixelizedImage ? (
                    <img
                      src={pixelizedImage || "/placeholder.svg"}
                      alt="Pixelized result"
                      className="max-w-full max-h-full object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : selectedImage ? (
                    <div className="text-center space-y-2">
                      <Palette className="w-6 h-6 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">Ready to process</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-6 h-6 border-2 border-dashed border-muted-foreground/50 rounded mx-auto" />
                      <p className="text-xs text-muted-foreground">Preview will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button onClick={processImage} disabled={!selectedImage || isProcessing} className="w-full h-10" size="lg">
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
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" onClick={downloadImage} className="w-full bg-transparent">
                      <Download className="w-3 h-3 mr-2" />
                      Download Preview (Upscaled)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadBaseResolution}
                      className="w-full bg-transparent"
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Download Base Resolution ({gridSize}×{gridSize})
                    </Button>
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
