export type HslBand = 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta'

export interface HslShift {
  hue: number
  sat: number
  lum: number
}

export interface Adjustments {
  exposure: number
  contrast: number
  highlights: number
  shadows: number
  whites: number
  blacks: number
  temperature: number
  tint: number
  vibrance: number
  saturation: number
  clarity: number
  sharpness: number
  fade: number
  vignette: number
  grain: number
  /** Split toning: tint colors (hue in degrees) blended into shadows and highlights. */
  shadowHue: number
  shadowAmount: number
  highlightHue: number
  highlightAmount: number
  hsl: Record<HslBand, HslShift>
}

/** A filter applied on top of the manual adjustments, at a given strength (0..1). */
export interface Look {
  id: string | null
  amount: number
}

interface LayerBase {
  id: string
  /** Center, as a fraction of the output width and height. */
  x: number
  y: number
  /** Size as a fraction of the output width (font size for text, width for images). */
  size: number
  /** Radians. */
  rotation: number
}

export interface TextLayer extends LayerBase {
  kind: 'text'
  text: string
  font: string
  color: string
  background: 'none' | 'solid' | 'shadow'
}

export interface StickerLayer extends LayerBase {
  kind: 'sticker'
  emoji?: string
  image?: ImageBitmap
}

export type Layer = TextLayer | StickerLayer

export interface Transform {
  rotation: 0 | 90 | 180 | 270
  straighten: number
  flipH: boolean
  aspect: number | null
  zoom: number
  panX: number
  panY: number
}

/** Editable texts printed on the frame; an empty field is not printed. */
export interface FrameInfo {
  camera: string
  lens: string
  exposure: string
  date: string
}

export interface FrameSettings {
  styleId: string
  color: string
  caption: string
  /** Font ids from the font registry. */
  font: string
  metaFont: string
  info: FrameInfo
  /** Output aspect ratio for the blurred-background style; null fits the photo. */
  canvasAspect: number | null
  innerBorder: boolean
  shadow: boolean
}

export interface ExifSummary {
  make?: string
  model?: string
  lens?: string
  focalLength?: number
  fNumber?: number
  exposureTime?: number
  iso?: number
  date?: Date
  width?: number
  height?: number
  latitude?: number
  longitude?: number
  altitude?: number
  software?: string
  raw: Record<string, unknown>
}

export interface LoadedPhoto {
  file: File
  full: ImageBitmap
  preview: ImageBitmap
  exif: ExifSummary | null
}

export interface CollageCell {
  id: string
  photo: LoadedPhoto
  adjustments: Adjustments
  look: Look
  zoom: number
  panX: number
  panY: number
}

export type BackgroundKind = 'color' | 'gradient' | 'blur'

export interface CollageSettings {
  layoutId: string
  aspect: number
  /** Gap, margin and radius as a fraction of the canvas short side. */
  gap: number
  margin: number
  radius: number
  background: BackgroundKind
  color: string
  gradient: number
  /** Index of the cell whose photo is blurred for the background. */
  blurSource: number
  caption: string
  font: string
}

export interface CollageState {
  cells: CollageCell[]
  settings: CollageSettings
  layers: Layer[]
}
