// Pixelization engine - JavaScript implementation of the Python script
// Handles image processing with LAB color space quantization

export interface ColorPalette {
  name: string
  colors: string[]
}

export interface PixelizationParams {
  gridSize: number
  pixelSize: number
  palette: ColorPalette
}

// Convert hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) throw new Error(`Invalid hex color: ${hex}`)
  return [Number.parseInt(result[1], 16), Number.parseInt(result[2], 16), Number.parseInt(result[3], 16)]
}

// Convert RGB to LAB color space for better color matching
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // Normalize RGB values
  let rNorm = r / 255
  let gNorm = g / 255
  let bNorm = b / 255

  // Apply gamma correction
  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92

  // Convert to XYZ
  let x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375
  let y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.072175
  let z = rNorm * 0.0193339 + gNorm * 0.119192 + bNorm * 0.9503041

  // Normalize by D65 white point
  x /= 0.95047
  y /= 1.0
  z /= 1.08883

  // Convert to LAB
  const fx = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116
  const fy = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116
  const fz = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116

  const L = 116 * fy - 16
  const A = 500 * (fx - fy)
  const B = 200 * (fy - fz)

  return [L, A, B]
}

// Find closest color in palette using LAB distance
function findClosestColor(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
): [number, number, number] {
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])

  let minDistance = Number.POSITIVE_INFINITY
  let closestColor = palette[0]

  for (const color of palette) {
    const [l, a, b] = rgbToLab(color[0], color[1], color[2])
    const distance = Math.sqrt(Math.pow(targetL - l, 2) + Math.pow(targetA - a, 2) + Math.pow(targetB - b, 2))

    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }

  return closestColor
}

// Find closest color in palette using LAB distance with enhanced perceptual weighting
function findClosestColorEnhanced(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
): [number, number, number] {
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])

  let minDistance = Number.POSITIVE_INFINITY
  let closestColor = palette[0]

  for (const color of palette) {
    const [l, a, b] = rgbToLab(color[0], color[1], color[2])

    // Enhanced distance calculation with perceptual weighting
    // Weight luminance more heavily as human eyes are more sensitive to brightness
    const deltaL = targetL - l
    const deltaA = targetA - a
    const deltaB = targetB - b

    // CIE94 inspired distance calculation for better perceptual accuracy
    const distance = Math.sqrt(2 * deltaL * deltaL + 4 * deltaA * deltaA + deltaB * deltaB)

    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }

  return closestColor
}

// Find closest color in palette using LAB distance with artistic dithering
function findClosestColorArtistic(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
  x: number,
  y: number,
): [number, number, number] {
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])

  let minDistance = Number.POSITIVE_INFINITY
  let closestColor = palette[0]

  for (const color of palette) {
    const [l, a, b] = rgbToLab(color[0], color[1], color[2])

    // Artistic distance calculation with spatial dithering
    const deltaL = targetL - l
    const deltaA = targetA - a
    const deltaB = targetB - b

    // Add subtle spatial noise for more organic look
    const spatialNoise = (Math.sin(x * 0.7) + Math.cos(y * 0.5)) * 2
    const distance = Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB) + spatialNoise

    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }

  return closestColor
}

// Bayer matrix for ordered dithering (4x4)
const BAYER_MATRIX_4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

// Find closest color in palette using Bayer dithering
function findClosestColorBayer(
  targetRgb: [number, number, number],
  palette: [number, number, number][],
  x: number,
  y: number,
): [number, number, number] {
  const [targetL, targetA, targetB] = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])

  // Get Bayer threshold value (0-15) normalized to 0-1
  const bayerX = x % 4
  const bayerY = y % 4
  const bayerValue = BAYER_MATRIX_4x4[bayerY][bayerX] / 16.0

  let minDistance = Number.POSITIVE_INFINITY
  let closestColor = palette[0]
  let secondClosest = palette[1] || palette[0]

  // Find two closest colors
  for (const color of palette) {
    const [l, a, b] = rgbToLab(color[0], color[1], color[2])
    const distance = Math.sqrt(Math.pow(targetL - l, 2) + Math.pow(targetA - a, 2) + Math.pow(targetB - b, 2))

    if (distance < minDistance) {
      secondClosest = closestColor
      minDistance = distance
      closestColor = color
    }
  }

  // Apply Bayer dithering - use threshold to choose between closest and second closest
  const brightness = (targetRgb[0] * 0.299 + targetRgb[1] * 0.587 + targetRgb[2] * 0.114) / 255
  const closestBrightness = (closestColor[0] * 0.299 + closestColor[1] * 0.587 + closestColor[2] * 0.114) / 255
  const secondBrightness = (secondClosest[0] * 0.299 + secondClosest[1] * 0.587 + secondClosest[2] * 0.114) / 255

  // Use Bayer threshold to decide between colors based on brightness difference
  const brightnessDiff = Math.abs(brightness - closestBrightness)
  const shouldDither = bayerValue < brightnessDiff && Math.abs(brightness - secondBrightness) < brightnessDiff * 1.5

  return shouldDither ? secondClosest : closestColor
}

// Main pixelization function
export async function pixelizeImage(imageFile: File | string, params: PixelizationParams): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        // Convert palette colors to RGB tuples
        const paletteRgb: [number, number, number][] = params.palette.colors.map((hex) => hexToRgb(hex))

        // Step 1: Resize to square and then to grid size
        const size = Math.min(img.width, img.height)
        const offsetX = (img.width - size) / 2
        const offsetY = (img.height - size) / 2

        // Create temporary canvas for square crop
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")!
        tempCanvas.width = size
        tempCanvas.height = size

        // Draw cropped square image
        tempCtx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)

        // Step 2: Resize to grid size
        canvas.width = params.gridSize
        canvas.height = params.gridSize
        ctx.imageSmoothingEnabled = false // Nearest neighbor
        ctx.drawImage(tempCanvas, 0, 0, params.gridSize, params.gridSize)

        // Step 3: Get pixel data and quantize colors
        const imageData = ctx.getImageData(0, 0, params.gridSize, params.gridSize)
        const data = imageData.data

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          const closestColor = findClosestColor([r, g, b], paletteRgb)
          data[i] = closestColor[0] // R
          data[i + 1] = closestColor[1] // G
          data[i + 2] = closestColor[2] // B
          // Alpha stays the same
        }

        ctx.putImageData(imageData, 0, 0)

        const displaySize = 512 // Fixed display size for consistent preview
        const finalCanvas = document.createElement("canvas")
        const finalCtx = finalCanvas.getContext("2d")!
        finalCanvas.width = displaySize
        finalCanvas.height = displaySize
        finalCtx.imageSmoothingEnabled = false // Maintain pixelated look

        finalCtx.drawImage(canvas, 0, 0, displaySize, displaySize)

        // Return as data URL
        resolve(finalCanvas.toDataURL("image/png"))
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error("Failed to load image"))

    if (typeof imageFile === "string") {
      img.src = imageFile
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
    }
  })
}

// Enhanced pixelization with dithering and better color mixing
export async function pixelizeImageEnhanced(imageFile: File | string, params: PixelizationParams): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        // Convert palette colors to RGB tuples
        const paletteRgb: [number, number, number][] = params.palette.colors.map((hex) => hexToRgb(hex))

        // Step 1: Resize to square and then to a higher intermediate resolution for better sampling
        const size = Math.min(img.width, img.height)
        const offsetX = (img.width - size) / 2
        const offsetY = (img.height - size) / 2

        // Create temporary canvas for square crop at higher resolution
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")!
        const intermediateSize = params.gridSize * 4 // 4x higher for better sampling
        tempCanvas.width = intermediateSize
        tempCanvas.height = intermediateSize

        // Draw cropped square image at higher resolution
        tempCtx.drawImage(img, offsetX, offsetY, size, size, 0, 0, intermediateSize, intermediateSize)

        // Step 2: Sample blocks and apply enhanced color quantization
        canvas.width = params.gridSize
        canvas.height = params.gridSize

        const blockSize = intermediateSize / params.gridSize
        const finalImageData = ctx.createImageData(params.gridSize, params.gridSize)
        const tempImageData = tempCtx.getImageData(0, 0, intermediateSize, intermediateSize)

        for (let y = 0; y < params.gridSize; y++) {
          for (let x = 0; x < params.gridSize; x++) {
            // Sample multiple pixels in each block for better color representation
            let totalR = 0,
              totalG = 0,
              totalB = 0,
              sampleCount = 0

            // Sample a 3x3 grid within each block for better color averaging
            for (let dy = 0; dy < 3; dy++) {
              for (let dx = 0; dx < 3; dx++) {
                const sampleX = Math.floor(x * blockSize + ((dx + 0.5) * blockSize) / 3)
                const sampleY = Math.floor(y * blockSize + ((dy + 0.5) * blockSize) / 3)

                if (sampleX < intermediateSize && sampleY < intermediateSize) {
                  const pixelIndex = (sampleY * intermediateSize + sampleX) * 4
                  totalR += tempImageData.data[pixelIndex]
                  totalG += tempImageData.data[pixelIndex + 1]
                  totalB += tempImageData.data[pixelIndex + 2]
                  sampleCount++
                }
              }
            }

            // Average the sampled colors
            const avgR = Math.round(totalR / sampleCount)
            const avgG = Math.round(totalG / sampleCount)
            const avgB = Math.round(totalB / sampleCount)

            // Apply enhanced color matching with perceptual weighting
            const closestColor = findClosestColorEnhanced([avgR, avgG, avgB], paletteRgb)

            const finalIndex = (y * params.gridSize + x) * 4
            finalImageData.data[finalIndex] = closestColor[0]
            finalImageData.data[finalIndex + 1] = closestColor[1]
            finalImageData.data[finalIndex + 2] = closestColor[2]
            finalImageData.data[finalIndex + 3] = 255
          }
        }

        ctx.putImageData(finalImageData, 0, 0)

        // Step 3: Scale up with enhanced interpolation
        const displaySize = 512
        const finalCanvas = document.createElement("canvas")
        const finalCtx = finalCanvas.getContext("2d")!
        finalCanvas.width = displaySize
        finalCanvas.height = displaySize
        finalCtx.imageSmoothingEnabled = false

        finalCtx.drawImage(canvas, 0, 0, displaySize, displaySize)

        resolve(finalCanvas.toDataURL("image/png"))
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error("Failed to load image"))

    if (typeof imageFile === "string") {
      img.src = imageFile
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
    }
  })
}

// Artistic pixelization with dithering and enhanced color mixing
export async function pixelizeImageArtistic(imageFile: File | string, params: PixelizationParams): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const paletteRgb: [number, number, number][] = params.palette.colors.map((hex) => hexToRgb(hex))

        // Step 1: Resize to square
        const size = Math.min(img.width, img.height)
        const offsetX = (img.width - size) / 2
        const offsetY = (img.height - size) / 2

        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")!
        tempCanvas.width = size
        tempCanvas.height = size

        tempCtx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)

        // Step 2: Resize to grid with slight smoothing for artistic effect
        canvas.width = params.gridSize
        canvas.height = params.gridSize
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(tempCanvas, 0, 0, params.gridSize, params.gridSize)

        // Step 3: Apply artistic color quantization with spatial awareness
        const imageData = ctx.getImageData(0, 0, params.gridSize, params.gridSize)
        const data = imageData.data

        for (let y = 0; y < params.gridSize; y++) {
          for (let x = 0; x < params.gridSize; x++) {
            const i = (y * params.gridSize + x) * 4
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            // Apply contrast enhancement for more dramatic effect
            const enhancedR = Math.min(255, Math.max(0, (r - 128) * 1.2 + 128))
            const enhancedG = Math.min(255, Math.max(0, (g - 128) * 1.2 + 128))
            const enhancedB = Math.min(255, Math.max(0, (b - 128) * 1.2 + 128))

            const closestColor = findClosestColorArtistic([enhancedR, enhancedG, enhancedB], paletteRgb, x, y)
            data[i] = closestColor[0]
            data[i + 1] = closestColor[1]
            data[i + 2] = closestColor[2]
          }
        }

        ctx.putImageData(imageData, 0, 0)

        // Step 4: Scale up with artistic edge enhancement
        const displaySize = 512
        const finalCanvas = document.createElement("canvas")
        const finalCtx = finalCanvas.getContext("2d")!
        finalCanvas.width = displaySize
        finalCanvas.height = displaySize
        finalCtx.imageSmoothingEnabled = false

        finalCtx.drawImage(canvas, 0, 0, displaySize, displaySize)

        resolve(finalCanvas.toDataURL("image/png"))
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error("Failed to load image"))

    if (typeof imageFile === "string") {
      img.src = imageFile
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
    }
  })
}

// Bayer dithering pixelization with ordered dithering patterns
export async function pixelizeImageBayer(imageFile: File | string, params: PixelizationParams): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const paletteRgb: [number, number, number][] = params.palette.colors.map((hex) => hexToRgb(hex))

        // Step 1: Resize to square
        const size = Math.min(img.width, img.height)
        const offsetX = (img.width - size) / 2
        const offsetY = (img.height - size) / 2

        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")!
        tempCanvas.width = size
        tempCanvas.height = size

        tempCtx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)

        // Step 2: Resize to grid size with high quality for better dithering
        canvas.width = params.gridSize
        canvas.height = params.gridSize
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(tempCanvas, 0, 0, params.gridSize, params.gridSize)

        // Step 3: Apply Bayer dithering
        const imageData = ctx.getImageData(0, 0, params.gridSize, params.gridSize)
        const data = imageData.data

        for (let y = 0; y < params.gridSize; y++) {
          for (let x = 0; x < params.gridSize; x++) {
            const i = (y * params.gridSize + x) * 4
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            // Apply Bayer dithering with spatial position
            const closestColor = findClosestColorBayer([r, g, b], paletteRgb, x, y)
            data[i] = closestColor[0]
            data[i + 1] = closestColor[1]
            data[i + 2] = closestColor[2]
          }
        }

        ctx.putImageData(imageData, 0, 0)

        // Step 4: Scale up maintaining the dithered pattern
        const displaySize = 512
        const finalCanvas = document.createElement("canvas")
        const finalCtx = finalCanvas.getContext("2d")!
        finalCanvas.width = displaySize
        finalCanvas.height = displaySize
        finalCtx.imageSmoothingEnabled = false // Preserve crisp dithering pattern

        finalCtx.drawImage(canvas, 0, 0, displaySize, displaySize)

        resolve(finalCanvas.toDataURL("image/png"))
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error("Failed to load image"))

    if (typeof imageFile === "string") {
      img.src = imageFile
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)
    }
  })
}

// Default palettes matching the YAML structure
export const DEFAULT_PALETTES: ColorPalette[] = [
  {
    name: "Flying Tiger",
    colors: [
      "#000000",
      "#ffffff",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ffa500",
      "#800080",
      "#ff69b4",
      "#00ffff",
    ],
  },
  {
    name: "Black & White",
    colors: ["#000000", "#ffffff"],
  },
  {
    name: "Cozy 8",
    colors: ["#2e294e", "#541388", "#f1e9da", "#ffd400", "#d90368", "#0081a7", "#00afb9", "#fed9b7"],
  },
  {
    name: "Gameboy",
    colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  },
  {
    name: "Sunset",
    colors: ["#2d1b69", "#11306b", "#f72585", "#b5179e", "#7209b7", "#480ca8", "#3a0ca3", "#3f37c9"],
  },
]
