"use client"

import type { PixelizationAlgorithm } from "@/lib/algorithms"

interface AlgorithmSelectorProps {
  algorithms: PixelizationAlgorithm[]
  value: string
  onChange: (name: string) => void
}

export function AlgorithmSelector({ algorithms, value, onChange }: AlgorithmSelectorProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {algorithms.map((algo) => (
          <button
            key={algo.name}
            onClick={() => onChange(algo.name)}
            className={`p-2 rounded-md border text-xs font-medium transition-colors ${
              value === algo.name ? "border-foreground bg-foreground text-background" : "border-border/50 hover:border-border"
            }`}
          >
            {algo.name}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {algorithms.find((a) => a.name === value)?.description || "Select an algorithm"}
      </p>
    </>
  )
}


