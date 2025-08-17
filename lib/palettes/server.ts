import fs from "node:fs/promises"
import path from "node:path"
import type { ColorPalette } from "@/lib/algorithms"

function toHex(n: number): string {
  const clamped = Math.max(0, Math.min(255, Math.round(n)))
  return clamped.toString(16).padStart(2, "0")
}

export function parseGpl(content: string, fallbackName: string): ColorPalette {
  const lines = content.split(/\r?\n/)
  if (!lines[0]?.startsWith("GIMP Palette")) {
    throw new Error("Not a GIMP palette file")
  }
  let name = fallbackName
  const colors: string[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (line.length === 0) continue
    if (line.startsWith("#")) {
      // header metadata
      const m = line.match(/^#\s*Palette\s+Name:\s*(.+)$/i)
      if (m && m[1]) name = m[1].trim()
      continue
    }
    // data row: R G B [Name]
    const parts = line.split(/\s+/)
    if (parts.length >= 3) {
      const r = Number(parts[0])
      const g = Number(parts[1])
      const b = Number(parts[2])
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        colors.push(`#${toHex(r)}${toHex(g)}${toHex(b)}`)
      }
    }
  }
  return { name, colors }
}

export function parseHexList(content: string, fallbackName: string): ColorPalette {
  const colors: string[] = []
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const hex = line.startsWith("#") ? line.slice(1) : line
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      colors.push(`#${hex.toLowerCase()}`)
    }
  }
  return { name: fallbackName, colors }
}

export async function loadPalettesFromDir(dir: string): Promise<ColorPalette[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  const palettes: ColorPalette[] = []
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const ext = path.extname(entry.name).toLowerCase()
    if (ext !== ".gpl" && ext !== ".hex") continue
    const full = path.join(dir, entry.name)
    const content = await fs.readFile(full, "utf8")
    const base = path.basename(entry.name, ext)
    try {
      if (ext === ".gpl") {
        palettes.push(parseGpl(content, base))
      } else {
        palettes.push(parseHexList(content, base))
      }
    } catch {
      // skip invalid files
    }
  }
  return palettes
}


