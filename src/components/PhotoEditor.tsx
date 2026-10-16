import { useCallback, useMemo, useState } from 'react'
import type { Adjustments, FrameSettings, Layer, LoadedPhoto, Look, Transform } from '../types'
import { neutralAdjustments } from '../lib/adjust'
import { autoAdjust, histogramOf } from '../lib/auto'
import { fitAspect, orientedSize, panCrop, zoomCrop } from '../lib/crop'
import { NO_LOOK } from '../lib/filters'
import { infoFromExif } from '../lib/exif'
import type { Histogram } from '../lib/pipeline'
import { exportImage, hasGps, naturalExportSize, type ExportOptions } from '../lib/render'
import { saveBlob } from '../lib/save'
import { useHistory } from '../hooks/useHistory'
import { useLayers } from '../hooks/useLayers'
import { useUndoKeys } from '../hooks/useUndoKeys'
import { AdjustPanel } from './AdjustPanel'
import { CropPanel } from './CropPanel'
import { CropStage } from './CropStage'
import { ExifPanel } from './ExifPanel'
import { ExportSheet } from './ExportSheet'
import { FilterPanel } from './FilterPanel'
import { FramePanel } from './FramePanel'
import { LayersPanel } from './LayersPanel'
import { Stage } from './Stage'
import { ToolRail, type Tool } from './ToolRail'
import { TopBar } from './TopBar'
import {
  IconAddPhotos,
  IconCheck,
  IconClose,
  IconCompare,
  IconCrop,
  IconFrame,
  IconImage,
  IconInfo,
  IconPresets,
  IconSliders,
  IconText,
} from './icons'

interface EditState {
  adjustments: Adjustments
  look: Look
  transform: Transform
  frame: FrameSettings
  layers: Layer[]
}

type Tab = 'filters' | 'edit' | 'crop' | 'frame' | 'layers' | 'info'

const TOOLS: Tool<Tab>[] = [
  { id: 'filters', label: 'Filtros', icon: <IconPresets /> },
  { id: 'edit', label: 'Editar', icon: <IconSliders /> },
  { id: 'crop', label: 'Recortar', icon: <IconCrop /> },
  { id: 'frame', label: 'Marco', icon: <IconFrame /> },
  { id: 'layers', label: 'Texto', icon: <IconText /> },
  { id: 'info', label: 'Datos', icon: <IconInfo /> },
]

function initialEdit(photo: LoadedPhoto): EditState {
  return {
    adjustments: neutralAdjustments(),
    look: NO_LOOK,
    layers: [],
    transform: { rotation: 0, straighten: 0, flipH: false, aspect: null, crop: fitAspect(orientedSize(photo.full, 0), null) },
    frame: {
      styleId: 'none',
      color: '#fbfbf8',
      caption: '',
      font: 'hand',
      metaFont: 'typewriter',
      info: infoFromExif(photo.exif),
      canvasAspect: 4 / 5,
      innerBorder: true,
      shadow: true,
    },
  }
}

interface PhotoEditorProps {
  photo: LoadedPhoto
  fontsReady: boolean
  onHome: () => void
  onOpenAnother: () => void
  /** Pick more photos and continue as a collage with this one. */
  onAddPhotos: () => void
}

export function PhotoEditor({ photo, fontsReady, onHome, onOpenAnother, onAddPhotos }: PhotoEditorProps) {
  const [tool, setTool] = useState<Tab | null>('filters')
  /** Crop being edited; it reaches the history only when applied. */
  const [cropDraft, setCropDraft] = useState<Transform | null>(null)
  const [chrome, setChrome] = useState(true)
  const [compare, setCompare] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [histogram, setHistogram] = useState<Histogram | null>(null)
  const history = useHistory<EditState>(initialEdit(photo))
  const edit = history.state

  const update = useCallback((patch: Partial<EditState>) => history.set({ ...edit, ...patch }), [history, edit])
  const layers = useLayers(edit.layers, (next) => update({ layers: next }), () => setTool('layers'))
  const original = useMemo(() => histogramOf(photo.preview), [photo])


  const pan = useCallback(
    (dx: number, dy: number) => {
      const t = edit.transform
      update({ transform: { ...t, crop: panCrop(t.crop, -dx * t.crop.w, -dy * t.crop.h) } })
    },
    [edit.transform, update],
  )

  const selectTool = (next: Tab | null) => {
    if (tool === 'crop' && cropDraft) update({ transform: cropDraft })
    setCropDraft(next === 'crop' ? edit.transform : null)
    setTool(next)
  }

  const applyCrop = () => {
    if (cropDraft) update({ transform: cropDraft })
    setCropDraft(null)
    setTool(null)
  }

  const cancelCrop = () => {
    setCropDraft(null)
    setTool(null)
  }

  const zoom = useCallback(
    (ratio: number) => {
      const t = edit.transform
      update({ transform: { ...t, crop: zoomCrop(t.crop, ratio) } })
    },
    [edit.transform, update],
  )

  const toggleCompare = useCallback((e: KeyboardEvent) => {
    if (e.key === '\\') setCompare((c) => !c)
  }, [])
  useUndoKeys(history.undo, history.redo, toggleCompare)

  const renderInput = useMemo(
    () => ({
      photo,
      transform: edit.transform,
      adjustments: compare ? neutralAdjustments() : edit.adjustments,
      look: compare ? NO_LOOK : edit.look,
      frame: edit.frame,
      layers: edit.layers,
    }),
    [photo, edit, compare],
  )

  const runExport = async (opts: ExportOptions, mode: 'download' | 'share') => {
    const result = await exportImage({ photo, ...edit }, opts)
    const ext = opts.format === 'image/png' ? 'png' : 'jpg'
    await saveBlob(result.blob, `${photo.file.name.replace(/\.[^.]+$/, '')}-marco.${ext}`, mode)
    return result
  }

  return (
    <div className="editor" data-chrome={chrome ? 'visible' : 'hidden'}>
      <TopBar onHome={onHome} history={history} onExport={() => setExporting(true)}>
        <button type="button" className="icon-btn" aria-pressed={compare} onClick={() => setCompare((c) => !c)}
          aria-label="Comparar con el original" title="Comparar con el original (\)">
          <IconCompare />
        </button>
        <button type="button" className="icon-btn" onClick={onOpenAnother} aria-label="Abrir otra foto" title="Abrir otra foto">
          <IconImage />
        </button>
        <button type="button" className="icon-btn" onClick={onAddPhotos} aria-label="Agregar fotos y crear un collage"
          title="Agregar fotos y crear un collage">
          <IconAddPhotos />
        </button>
      </TopBar>

      <main className="stage">
        {tool === 'crop' && cropDraft ? (
          <>
            <CropStage photo={photo.preview} transform={cropDraft} onChange={setCropDraft} />
            <div className="crop-actions">
              <button type="button" className="crop-action" onClick={cancelCrop} aria-label="Cancelar el recorte">
                <IconClose />
                <span>Cancelar</span>
              </button>
              <button type="button" className="crop-action crop-action-apply" onClick={applyCrop} aria-label="Aplicar el recorte">
                <IconCheck />
                <span>Aplicar</span>
              </button>
            </div>
          </>
        ) : (
          <Stage input={renderInput} fontsReady={fontsReady} layers={layers.gestures} onHistogram={setHistogram}
            onPan={pan} onZoom={zoom} onTap={() => setChrome((c) => !c)} />
        )}
        {compare && <span className="badge">Original</span>}
      </main>

      {tool && (
        <aside className="panel" key={tool}>
          <div className="panel-scroll">
            {tool === 'filters' && <FilterPanel source={photo.preview} value={edit.look} onChange={(look) => update({ look })} />}
            {tool === 'edit' && (
              <AdjustPanel value={edit.adjustments} histogram={histogram} onChange={(adjustments) => update({ adjustments })}
                onAuto={() => update({ adjustments: autoAdjust(edit.adjustments, original) })} />
            )}
            {tool === 'crop' && cropDraft && <CropPanel source={photo.full} value={cropDraft} onChange={setCropDraft} />}
            {tool === 'frame' && (
              <FramePanel value={edit.frame} exif={photo.exif} onChange={(frame) => update({ frame })} onStyleChange={(styleId) => update({ frame: { ...edit.frame, styleId } })} />
            )}
            {tool === 'layers' && (
              <LayersPanel layers={edit.layers} selected={layers.selected} onChange={layers.change} onSelect={layers.select} />
            )}
            {tool === 'info' && <ExifPanel exif={photo.exif} />}
          </div>
        </aside>
      )}

      <ToolRail tools={TOOLS} active={tool} onSelect={selectTool} label="Herramientas" />

      {exporting && (
        <ExportSheet
          naturalSize={naturalExportSize({ photo, ...edit })}
          canKeepExif={/jpe?g/i.test(photo.file.type) && Boolean(photo.exif)}
          hasGps={hasGps(photo.exif)}
          onExport={runExport}
          onClose={() => setExporting(false)}
        />
      )}
    </div>
  )
}
