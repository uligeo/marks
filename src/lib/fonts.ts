import '@fontsource/bebas-neue/latin-400.css'
import '@fontsource/caveat/latin-700.css'
import '@fontsource/courier-prime/latin-400.css'
import '@fontsource/courier-prime/latin-700.css'
import '@fontsource/dancing-script/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import '@fontsource/instrument-sans/latin-400.css'
import '@fontsource/instrument-sans/latin-600.css'
import '@fontsource/lora/latin-400.css'
import '@fontsource/lora/latin-600.css'
import '@fontsource/permanent-marker/latin-400.css'
import '@fontsource/playfair-display/latin-400.css'
import '@fontsource/playfair-display/latin-700.css'
import '@fontsource/special-elite/latin-400.css'

export interface FontOption {
  id: string
  label: string
  family: string
  /** Weight for captions and other prominent text. */
  bold: number
  /** Weight for secondary lines. */
  regular: number
  /** Legible enough for small camera data lines. */
  forData: boolean
}

export const FONTS: FontOption[] = [
  { id: 'sans', label: 'Limpia', family: '"Instrument Sans", sans-serif', bold: 600, regular: 400, forData: true },
  { id: 'hand', label: 'A mano', family: '"Caveat", cursive', bold: 700, regular: 700, forData: false },
  { id: 'script', label: 'Caligrafía', family: '"Dancing Script", cursive', bold: 700, regular: 700, forData: false },
  { id: 'marker', label: 'Marcador', family: '"Permanent Marker", cursive', bold: 400, regular: 400, forData: false },
  { id: 'typewriter', label: 'Máquina', family: '"Courier Prime", monospace', bold: 700, regular: 400, forData: true },
  { id: 'vintage', label: 'Antigua', family: '"Special Elite", monospace', bold: 400, regular: 400, forData: true },
  { id: 'mono', label: 'Técnica', family: '"IBM Plex Mono", monospace', bold: 600, regular: 400, forData: true },
  { id: 'serif', label: 'Clásica', family: '"Lora", serif', bold: 600, regular: 400, forData: true },
  { id: 'elegant', label: 'Elegante', family: '"Playfair Display", serif', bold: 700, regular: 400, forData: true },
  { id: 'poster', label: 'Titular', family: '"Bebas Neue", sans-serif', bold: 400, regular: 400, forData: false },
]

export const DATA_FONTS = FONTS.filter((f) => f.forData)

export function getFont(id: string): FontOption {
  return FONTS.find((f) => f.id === id) ?? FONTS[0]
}

/** Canvas text needs the faces loaded before drawing; CSS alone loads them lazily. */
export async function loadCanvasFonts(): Promise<void> {
  const faces = FONTS.flatMap((f) => [...new Set([f.bold, f.regular])].map((w) => `${w} 40px ${f.family}`))
  await Promise.allSettled(faces.map((face) => document.fonts.load(face)))
}
