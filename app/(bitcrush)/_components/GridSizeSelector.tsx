"use client"

interface GridSizeSelectorProps {
  options: { value: number; label: string }[]
  value: number
  onChange: (value: number) => void
}

export function GridSizeSelector({ options, value, onChange }: GridSizeSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {options.map((size) => (
        <button
          key={size.value}
          onClick={() => onChange(size.value)}
          className={`p-2 rounded-md border text-xs font-medium transition-colors ${
            value === size.value ? "border-foreground bg-foreground text-background" : "border-border/50 hover:border-border"
          }`}
        >
          {size.label}
        </button>
      ))}
    </div>
  )
}


