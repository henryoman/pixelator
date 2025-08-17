"use client"

import { useState, useRef } from "react"
import { ChevronDown } from "lucide-react"
import type { ColorPalette } from "@/lib/algorithms"

interface PalettePickerProps {
  palettes: ColorPalette[]
  value: string
  onChange: (name: string) => void
}

export function PalettePicker({ palettes, value, onChange }: PalettePickerProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const selected = palettes.find((p) => p.name === value) ?? palettes[0] ?? { name: "Default", colors: [] }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="w-full p-3 rounded-md border border-border/50 hover:border-border transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{selected.name}</span>
          <div className="flex gap-1">
            {selected.colors.slice(0, 6).map((color, index) => (
              <div key={index} className="w-3 h-3 rounded-sm border border-border/30" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/50 rounded-md shadow-lg z-[100] max-h-60 overflow-y-auto">
          {palettes.map((palette) => (
            <button
              key={palette.name}
              onClick={() => {
                onChange(palette.name)
                setOpen(false)
              }}
              className={`w-full p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0 ${
                value === palette.name ? "bg-muted/50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{palette.name}</span>
                <div className="flex gap-1">
                  {palette.colors.slice(0, 8).map((color, index) => (
                    <div key={index} className="w-2 h-2 rounded-sm border border-border/30" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
