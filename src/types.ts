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
  hsl: Record<HslBand, HslShift>
}

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
}
