## Bitcrush UI — Standalone HTML served by Bun

This document describes the current Bitcrush UI precisely and shows how to implement it as a single, minimal HTML page served by Bun. It contains no component or framework details and assumes your backend exists elsewhere. The goal is a tiny, fast, portable front end you can open in a browser and later wire to any backend (Rust/Tauri, etc.).

### What the UI includes

- **Header**: a sticky top bar with the Bitcrush logo (`/bitcrush.png`).
- **Subtle grid background**: faint animated grid overlay for depth.
- **Ambient dots**: 12 tiny bouncing squares positioned deterministically.
- **Main layout**: two columns on large screens; stacked on small screens.
  - **Left column**
    - Source Image: drag-and-drop or click-to-upload box with a small preview when selected.
    - Color Palette: dropdown to pick a palette by name.
    - Grid Resolution: dropdown with common square sizes.
    - Algorithm: dropdown to select the pixelization algorithm.
  - **Right column**
    - Output panel: large preview area with pixelated rendering style.
    - Primary button: “Generate Pixel Art”.
    - Download section: buttons to download the generated image(s).

Notes:
- All actions are front-end only. The “Generate” button and downloads are wired to placeholders; replace those with your backend integration when ready.
- The UI uses system fonts, inline CSS, and a few lines of vanilla JS. No frameworks.

### Quick start (Bun + single-file HTML)

1) Ensure Bun is installed (macOS):

```bash
brew install oven-sh/bun/bun
```

2) Create a tiny static server using Bun. Save this next to this document as `server.ts`:

```ts
// server.ts
const textTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".json", "application/json; charset=utf-8"],
])

function contentType(pathname: string): string {
  for (const [ext, type] of textTypes) {
    if (pathname.endsWith(ext)) return type
  }
  if (pathname.endsWith(".png")) return "image/png"
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg"
  if (pathname.endsWith(".webp")) return "image/webp"
  if (pathname.endsWith(".ico")) return "image/x-icon"
  return "application/octet-stream"
}

const cacheForever = {
  headers: {
    "Cache-Control": "public, max-age=31536000, immutable",
  },
}

const noStore = {
  headers: {
    "Cache-Control": "no-store",
  },
}

const server = Bun.serve({
  port: Number(process.env.PORT || 3000),
  async fetch(req) {
    const url = new URL(req.url)
    const { pathname } = url

    // Root -> index.html
    if (pathname === "/" || pathname === "/index.html") {
      const file = Bun.file("./index.html")
      if (!(await file.exists())) {
        return new Response("index.html not found", { status: 404 })
      }
      return new Response(file, { headers: { "Content-Type": "text/html; charset=utf-8", ...noStore.headers } })
    }

    // Serve logo and any other static file in the working directory
    const safe = pathname.replace(/^\/+/, "") // strip leading slashes
    let file = Bun.file(`./${safe}`)
    if (await file.exists()) {
      return new Response(file, { headers: { "Content-Type": contentType(pathname), ...cacheForever.headers } })
    }
    // Fallback to ./public/* so existing assets like public/bitcrush.png work with /bitcrush.png
    file = Bun.file(`./public/${safe}`)
    if (await file.exists()) {
      return new Response(file, { headers: { "Content-Type": contentType(pathname), ...cacheForever.headers } })
    }

    return new Response("Not found", { status: 404 })
  },
})

console.log(`Bitcrush UI running: http://localhost:${server.port}`)
```

3) Save the standalone UI as `index.html` (also next to this document). This is a single file with inline CSS and minimal JS mirroring the current UI:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bitcrush</title>
    <meta name="description" content="Bitcrush — Pixel art generator UI" />
    <link rel="preload" as="image" href="/bitcrush.png" />
    <style>
      :root {
        --bg: #0b0c0f;
        --fg: #e7e7e9;
        --muted-fg: #9aa0a6;
        --muted: #1b1d23;
        --border: #2a2e37;
        --primary: #8ab4f8;
        --surface: #101217;
        --radius: 10px;
      }
      @media (prefers-color-scheme: light) {
        :root {
          --bg: #ffffff;
          --fg: #0e1116;
          --muted-fg: #616975;
          --muted: #f5f7fb;
          --border: #e5e7eb;
          --surface: #ffffff;
          --primary: #2563eb;
        }
      }

      html, body {
        height: 100%;
      }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--fg);
        font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      }

      /* Header */
      .header {
        position: sticky;
        top: 0;
        z-index: 50;
        backdrop-filter: blur(6px);
        background: color-mix(in oklab, var(--bg), transparent 20%);
        border-bottom: 1px solid color-mix(in oklab, var(--border), transparent 50%);
      }
      .header-inner {
        max-width: 2000px;
        margin: 0 auto;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .logo {
        height: 24px;
        display: block;
      }

      /* Subtle grid background */
      .grid-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.06;
      }
      .grid-bg::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image: linear-gradient(90deg, transparent 24px, rgba(255,255,255,0.06) 25px, rgba(255,255,255,0.06) 26px, transparent 27px),
                          linear-gradient(transparent 24px, rgba(255,255,255,0.06) 25px, rgba(255,255,255,0.06) 26px, transparent 27px);
        background-size: 25px 25px;
        animation: gridPulse 6s ease-in-out infinite alternate;
      }
      @keyframes gridPulse {
        from { opacity: 0.8; }
        to { opacity: 0.4; }
      }

      /* Ambient dots */
      .dots {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
      }
      .dot {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 2px;
        background: color-mix(in oklab, var(--fg), transparent 90%);
        animation-name: bounce;
        animation-iteration-count: infinite;
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(-25%); }
        50% { transform: translateY(0); }
      }

      /* Layout */
      .container {
        max-width: 2000px;
        margin: 0 auto;
        padding: 24px;
        position: relative;
        z-index: 1;
      }
      .columns {
        display: grid;
        grid-template-columns: 1fr;
        gap: 24px;
      }
      @media (min-width: 1280px) {
        .columns { grid-template-columns: 1fr 1fr; }
      }

      /* Cards */
      .card {
        background: var(--surface);
        border: 1px solid color-mix(in oklab, var(--border), transparent 50%);
        border-radius: var(--radius);
      }
      .card-body {
        padding: 16px;
      }
      .card-title {
        font-size: 13px;
        font-weight: 600;
        margin: 0 0 12px 0;
      }

      /* Controls */
      .field { margin: 0 0 12px 0; }
      .label { display: block; font-size: 12px; margin: 0 0 8px 0; color: var(--muted-fg); }
      .select, .button, .input {
        appearance: none;
        font: inherit;
        color: inherit;
        background: var(--surface);
        border: 1px solid color-mix(in oklab, var(--border), transparent 40%);
        border-radius: 8px;
        padding: 8px 10px;
      }
      .select, .input { width: 100%; }
      .button {
        background: color-mix(in oklab, var(--primary), black 75%);
        border: 1px solid color-mix(in oklab, var(--primary), black 50%);
        color: white;
        font-weight: 600;
        cursor: pointer;
        height: 40px;
      }
      .button[disabled] { opacity: 0.6; cursor: not-allowed; }

      /* Uploader */
      .dropzone {
        border: 2px dashed color-mix(in oklab, var(--border), transparent 30%);
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        color: var(--muted-fg);
        cursor: pointer;
        transition: border-color 120ms ease;
      }
      .dropzone:hover { border-color: var(--border); }
      .thumb {
        width: 80px; height: 80px; object-fit: cover; border-radius: 6px; display: block; margin: 0 auto 6px auto;
      }
      .hint { font-size: 12px; color: var(--muted-fg); }

      /* Output */
      .output {
        width: 100%; height: 640px; border: 1px solid color-mix(in oklab, var(--border), transparent 50%);
        background: color-mix(in oklab, var(--muted), transparent 70%);
        display: flex; align-items: center; justify-content: center; border-radius: 10px;
      }
      .output-img { max-width: 100%; max-height: 100%; image-rendering: pixelated; object-fit: contain; }
      .empty-state { text-align: center; color: var(--muted-fg); font-size: 12px; }

      .spacer { height: 4px; }
    </style>
  </head>
  <body>
    <div class="grid-bg"></div>
    <div class="dots" id="dots"></div>

    <header class="header">
      <div class="header-inner">
        <img class="logo" src="/bitcrush.png" alt="Bitcrush" width="96" height="24" />
      </div>
    </header>

    <main class="container">
      <div class="columns">
        <div>
          <!-- Source Image -->
          <section class="card">
            <div class="card-body">
              <h3 class="card-title">Source Image</h3>
              <div id="dropzone" class="dropzone" role="button" tabindex="0" aria-label="Upload image">
                <img id="thumb" class="thumb" src="" alt="Selected image" style="display:none" />
                <div id="dropHint">
                  <div style="margin-bottom:6px">Drop image here</div>
                  <div class="hint">PNG, JPG up to 10MB</div>
                </div>
                <input id="file" type="file" accept="image/*" style="display:none" />
              </div>
            </div>
          </section>

          <!-- Color Palette -->
          <section class="card">
            <div class="card-body">
              <h3 class="card-title">Color Palette</h3>
              <div class="field">
                <label class="label" for="palette">Palette</label>
                <select id="palette" class="select" aria-label="Select palette">
                  <!-- Placeholder options; replace with backend-driven list -->
                  <option>Flying Tiger</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Grid Resolution -->
          <section class="card">
            <div class="card-body">
              <h3 class="card-title">Grid Resolution</h3>
              <div class="field">
                <label class="label" for="grid">Resolution</label>
                <select id="grid" class="select" aria-label="Select grid size">
                  <option value="8">8×8</option>
                  <option value="16">16×16</option>
                  <option value="32" selected>32×32</option>
                  <option value="64">64×64</option>
                  <option value="80">80×80</option>
                  <option value="96">96×96</option>
                  <option value="128">128×128</option>
                  <option value="192">192×192</option>
                  <option value="256">256×256</option>
                  <option value="288">288×288</option>
                  <option value="384">384×384</option>
                  <option value="512">512×512</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Algorithm -->
          <section class="card">
            <div class="card-body">
              <h3 class="card-title">Algorithm</h3>
              <div class="field">
                <label class="label" for="algorithm">Method</label>
                <select id="algorithm" class="select" aria-label="Select algorithm">
                  <!-- Placeholder names; replace with backend-driven list -->
                  <option>Standard</option>
                  <option>Enhanced</option>
                  <option>Artistic</option>
                  <option>Bayer</option>
                  <option>Floyd–Steinberg</option>
                  <option>Dual Color Dithering</option>
                  <option>Edge Dithering</option>
                  <option>Selective Dithering</option>
                  <option>Ordered Selective</option>
                  <option>Randomized Selective</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        <div>
          <!-- Output -->
          <section class="card">
            <div class="card-body">
              <div class="card-title" style="margin-bottom:12px">Output</div>
              <div class="output">
                <img id="output" class="output-img" alt="Pixelized result" src="" style="display:none" />
                <div id="outputEmpty" class="empty-state">
                  <div style="width:24px;height:24px;border:2px dashed color-mix(in oklab, var(--muted-fg), transparent 50%); border-radius:6px; margin:0 auto 6px"></div>
                  <div>Preview will appear here</div>
                </div>
              </div>
            </div>
          </section>

          <div class="spacer"></div>

          <button id="generate" class="button" disabled>Generate Pixel Art</button>

          <!-- Download Options (shown after generation) -->
          <section id="downloads" class="card" style="display:none; margin-top:12px">
            <div class="card-body">
              <div class="card-title" style="margin-bottom:12px">Download Options</div>
              <div style="display:flex; gap:8px; flex-wrap:wrap">
                <button id="download-upscaled" class="button" disabled>Download Upscaled PNG</button>
                <button id="download-base" class="button" disabled>Download Base PNG</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

    <script defer>
      // Ambient dots (12 deterministic squares)
      (function() {
        const root = document.getElementById('dots')
        for (let i = 0; i < 12; i++) {
          const left = ((i * 73) % 100) + (i % 2 === 0 ? 0.5 : 0)
          const top = ((i * 37) % 100) + (i % 3 === 0 ? 0.25 : 0)
          const delay = ((i * 487) % 3000) / 1000
          const duration = 3 + (((i * 911) % 2000) / 1000)
          const el = document.createElement('div')
          el.className = 'dot'
          el.style.left = left + '%'
          el.style.top = top + '%'
          el.style.animationDelay = delay + 's'
          el.style.animationDuration = duration + 's'
          root.appendChild(el)
        }
      })()

      // Simple UI state
      const fileInput = document.getElementById('file')
      const dropzone = document.getElementById('dropzone')
      const thumb = document.getElementById('thumb')
      const dropHint = document.getElementById('dropHint')
      const output = document.getElementById('output')
      const outputEmpty = document.getElementById('outputEmpty')
      const palette = document.getElementById('palette')
      const grid = document.getElementById('grid')
      const algorithm = document.getElementById('algorithm')
      const generate = document.getElementById('generate')
      const downloads = document.getElementById('downloads')
      const dlUpscaled = document.getElementById('download-upscaled')
      const dlBase = document.getElementById('download-base')

      let selectedImage = null
      let pixelizedImage = null
      let baseImage = null
      let isProcessing = false

      function setProcessing(val: boolean) {
        isProcessing = val
        generate.disabled = !selectedImage || isProcessing
        generate.textContent = isProcessing ? 'Processing…' : 'Generate Pixel Art'
      }

      function setPreview(src: string | null) {
        if (src) {
          output.style.display = ''
          output.src = src
          outputEmpty.style.display = 'none'
        } else {
          output.style.display = 'none'
          output.src = ''
          outputEmpty.style.display = ''
        }
      }

      function enableDownloads(upscaled: string | null, base: string | null) {
        downloads.style.display = upscaled || base ? '' : 'none'
        dlUpscaled.disabled = !upscaled
        dlBase.disabled = !base
      }

      function downloadDataURL(dataURL: string, filename: string) {
        const a = document.createElement('a')
        a.href = dataURL
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
      }

      dlUpscaled.addEventListener('click', () => {
        if (pixelizedImage) downloadDataURL(pixelizedImage, 'bitcrush-upscaled.png')
      })
      dlBase.addEventListener('click', () => {
        if (baseImage) downloadDataURL(baseImage, 'bitcrush-base.png')
      })

      function handleFile(file: File) {
        const reader = new FileReader()
        reader.onload = (e) => {
          selectedImage = String(e.target && e.target.result || '')
          thumb.src = selectedImage
          thumb.style.display = ''
          dropHint.style.display = 'none'
          generate.disabled = !selectedImage
          setPreview(null)
          pixelizedImage = null
          baseImage = null
          enableDownloads(null, null)
        }
        reader.readAsDataURL(file)
      }

      dropzone.addEventListener('click', () => fileInput.click())
      dropzone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click() })
      dropzone.addEventListener('dragover', (e) => { e.preventDefault(); })
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault()
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
        if (file) handleFile(file)
      })
      fileInput.addEventListener('change', (e) => {
        const tgt = e.target
        const file = tgt && tgt.files && tgt.files[0]
        if (file) handleFile(file)
      })

      // Placeholder generation — replace with your backend integration
      async function generatePixelArt() {
        if (!selectedImage) return
        setProcessing(true)
        try {
          const params = {
            gridSize: Number(grid.value),
            paletteName: palette.value,
            algorithm: algorithm.value,
          }
          // If a backend is available on window.Bitcrush.generate, call it; otherwise stub.
          // Expected backend return: { upscaledDataURL: string, baseDataURL: string }
          const gen = (typeof window !== 'undefined' && window.Bitcrush && window.Bitcrush.generate)
            ? window.Bitcrush.generate(selectedImage, params)
            : new Promise((resolve) => setTimeout(() => resolve({ upscaledDataURL: selectedImage, baseDataURL: selectedImage }), 500))

          const result = await gen
          const upscaledDataURL = result && result.upscaledDataURL || selectedImage
          const baseDataURL = result && result.baseDataURL || selectedImage
          pixelizedImage = upscaledDataURL
          baseImage = baseDataURL
          setPreview(pixelizedImage)
          enableDownloads(pixelizedImage, baseImage)
        } catch (err) {
          console.error(err)
          // On error, show the original to avoid a blank screen
          pixelizedImage = selectedImage
          baseImage = selectedImage
          setPreview(pixelizedImage)
          enableDownloads(pixelizedImage, baseImage)
        } finally {
          setProcessing(false)
        }
      }

      generate.addEventListener('click', generatePixelArt)
    </script>
  </body>
  </html>
```

4) Start the server:

```bash
bun run server.ts | cat
```

Then open `http://localhost:3000` in your browser.

### Hooking up your backend later (placeholders already in place)

- Replace the placeholder generation function with your real backend call. For example, in a desktop app you might expose a global `window.Bitcrush.generate(imageSrc, { gridSize, paletteName, algorithm })` that returns `{ upscaledDataURL, baseDataURL }`.
- Populate the “Color Palette” and “Algorithm” dropdowns from your backend or an injected global (e.g., `window.__PALETTES__`, `window.__ALGORITHMS__`) if you prefer to avoid network requests.

### Performance notes

- Single HTML file with inline CSS and minimal JS; no runtime dependencies.
- Uses system fonts (no webfont cost).
- Small deterministic ambient animation, minimal repaint.
- Asset caching headers for static files (logo) via Bun server; `index.html` served with `no-store` to avoid stale UI during local development.

### Accessibility notes

- All interactive controls are labeled (`aria-label` / associated `<label>`s).
- Drag-and-drop area is keyboard-accessible (Enter/Space) and clickable.
- Color contrast targets dark and light modes with `prefers-color-scheme`.

This is the smallest faithful reproduction of the current Bitcrush UI using plain HTML/CSS/JS and Bun as the server—with clear placeholders ready to connect to your backend.


