"use client"

import { useRef } from "react"
import { Upload } from "lucide-react"

interface ImageUploaderProps {
  value: string | null
  onChange: (dataUrl: string) => void
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        onChange(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      <div
        className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-border transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        {value ? (
          <div className="space-y-2">
            <img src={value || "/placeholder.svg"} alt="Selected" className="w-20 h-20 object-cover rounded-md mx-auto" />
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
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
    </div>
  )
}


