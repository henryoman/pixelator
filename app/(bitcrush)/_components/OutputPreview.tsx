"use client"

interface OutputPreviewProps {
  image: string | null
}

export function OutputPreview({ image }: OutputPreviewProps) {
  return (
    <div className="w-full h-[640px] bg-muted/30 flex items-center justify-center border border-border/30">
      {image ? (
        <img src={image || "/placeholder.svg"} alt="Pixelized result" className="max-w-full max-h-full object-contain" style={{ imageRendering: "pixelated" }} />
      ) : (
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-dashed border-muted-foreground/50 rounded mx-auto" />
          <p className="text-xs text-muted-foreground">Preview will appear here</p>
        </div>
      )}
    </div>
  )
}


