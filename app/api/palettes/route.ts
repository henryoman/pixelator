import { NextResponse } from "next/server"
import type { ColorPalette } from "@/lib/algorithms"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { loadPalettesFromDir } = await import("@/lib/palettes/server")
    const dir = `${process.cwd()}/config/gpl-palettes`
    const palettes: ColorPalette[] = await loadPalettesFromDir(dir)
    return NextResponse.json({ palettes })
  } catch (e) {
    return NextResponse.json({ palettes: [] }, { status: 200 })
  }
}


