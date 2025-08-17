"use client"

import { useState, useCallback, useEffect } from "react"
import type { PixelizationParams } from "@/lib/algorithms"
import { pixelizeImage } from "@/lib/pixelizer/pixelizeImage"

export function usePixelization() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [pixelizedImage, setPixelizedImage] = useState<string | null>(null)
  const [baseResolutionImage, setBaseResolutionImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extraPalettes, setExtraPalettes] = useState<{ name: string; colors: string[] }[] | null>(null)

  // Lazy fetch extra palettes from server
  useEffect(() => {
    let cancelled = false
    fetch("/api/palettes")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (Array.isArray(d?.palettes)) setExtraPalettes(d.palettes)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const processImage = useCallback(async (imageSrc: string, params: PixelizationParams, algorithmName: string) => {
    setIsProcessing(true)
    setError(null)
    try {
      const upscaled = await pixelizeImage(imageSrc, params, algorithmName)
      setPixelizedImage(upscaled)
      const base = await pixelizeImage(imageSrc, { ...params, noUpscale: true }, algorithmName)
      setBaseResolutionImage(base)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pixelization failed")
      setPixelizedImage(imageSrc)
      setBaseResolutionImage(imageSrc)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return { isProcessing, pixelizedImage, baseResolutionImage, error, processImage, extraPalettes }
}


