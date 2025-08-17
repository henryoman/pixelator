"use client"

import Image from "next/image"

interface OutputPreviewProps {
  image: string | null
}

export function OutputPreview({ image }: OutputPreviewProps) {
  return (
    <div className="relative w-full h-[640px] bg-muted/30 border border-border/30">
      {image ? (
        <Image
          src={image || "/placeholder.svg"}
          alt="Pixelized result"
          fill
          sizes="100vw"
          className="object-contain"
          style={{ imageRendering: "pixelated" }}
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-center space-y-2">
          <div>
            <div className="w-6 h-6 border-2 border-dashed border-muted-foreground/50 rounded mx-auto" />
            <p className="text-xs text-muted-foreground mt-2">Preview will appear here</p>
          </div>
        </div>
      )}
    </div>
  )
}

