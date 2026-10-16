import { useCallback, useMemo, useState } from 'react'
import type { Adjustments, FrameSettings, LoadedPhoto, Transform } from '../types'
import { neutralAdjustments } from '../lib/adjust'
import { infoFromExif } from '../lib/exif'
import { getFrameStyle } from '../lib/frame'
import type { Histogram } from '../lib/pipeline'
import { exportImage, hasGps, type ExportOptions } from '../lib/render'
import { saveBlob } from '../lib/save'
import { useHistory } from '../hooks/useHistory'
import { useUndoKeys } from '../hooks/useUndoKeys'
import { AdjustPanel } from './AdjustPanel'
import { CropPanel } from './CropPanel'
import { ExifPanel } from './ExifPanel'
import { ExportSheet } from './ExportSheet'
import { FramePanel } from './FramePanel'
import { Stage } from './Stage'
import { TopBar } from './TopBar'

interface EditState {
  adjustments: Adjustments
  transform: Transform
  frame: FrameSettings
}

type Tab = 'edit' | 'crop' | 'frame' | 'info'

const TABS: { id: Tab; label: string }[] = [
  { id: 'edit', label: 'Editar' },
  { id: 'crop', label: 'Recortar' },
  { id: 'frame', label: 'Marco' },
  { id: 'info', label: 'Datos' },
]

const PAN_SENSITIVITY = 2.5

function initialEdit(photo: LoadedPhoto): EditState {
  return {
    adjustments: neutralAdjustments(),
    transform: { rotation: 0, straighten: 0, flipH: false, aspect: 1, zoom: 1, panX: 0, panY: 0 },
    frame: {
      styleId: 'classic',
      color: '#fbfbf8',
      caption: '',
      font: 'hand',
      info: infoFromExif(photo.exif),
      canvasAspect: 4 / 5,
      innerBorder: true,
      shadow: true,
    },
  }
}

const clampPan = (v: number): number => Math.max(-1, Math.min(1, v))

interface PhotoEditorProps {
  photo: LoadedPhoto
  fontsReady: boolean
  onHome: () => void
  onOpenAnother: () => void
}

export function PhotoEditor({ photo, fontsReady, onHome, onOpenAnother }: PhotoEditorProps) {
  const [tab, setTab] = useState<Tab>('edit')
  const [compare, setCompare] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [histogram, setHistogram] = useState<Histogram | null>(null)
  const history = useHistory<EditState>(initialEdit(photo))
  const edit = history.state

  const update = useCallback((patch: Partial<EditState>) => history.set({ ...edit, ...patch }), [history, edit])

  const changeFrameStyle = (styleId: string) => {
    const style = getFrameStyle(styleId)
    update({
      frame: { ...edit.frame, styleId },
      transform: { ...edit.transform, aspect: style.aspect, panX: 0, panY: 0 },
    })
  }

  const pan = useCallback(
    (dx: number, dy: number) => {
      const t = edit.transform
      update({ transform: { ...t, panX: clampPan(t.panX - dx * PAN_SENSITIVITY), panY: clampPan(t.panY - dy * PAN_SENSITIVITY) } })
    },
    [edit.transform, update],
  )

  const toggleCompare = useCallback((e: KeyboardEvent) => {
    if (e.key === '\\') setCompare((c) => !c)
  }, [])
  useUndoKeys(history.undo, history.redo, toggleCompare)

  const renderInput = useMemo(
    () => ({ photo, transform: edit.transform, adjustments: compare ? neutralAdjustments() : edit.adjustments, frame: edit.frame }),
    [photo, edit, compare],
  )

  const runExport = async (opts: ExportOptions, mode: 'download' | 'share') => {
    const blob = await exportImage({ photo, ...edit }, opts)
    const ext = opts.format === 'image/png' ? 'png' : 'jpg'
    await saveBlob(blob, `${photo.file.name.replace(/\.[^.]+$/, '')}-marco.${ext}`, mode)
  }

  return (
    <>
      <TopBar onHome={onHome} history={history} onExport={() => setExporting(true)}>
        <button type="button" className="icon-btn" aria-pressed={compare} onClick={() => setCompare((c) => !c)} title="Comparar con el original (\)">
          Antes
        </button>
        <button type="button" className="btn btn-ghost hide-mobile" onClick={onOpenAnother}>
          Otra foto
        </button>
      </TopBar>

      <main className="stage">
        <Stage input={renderInput} fontsReady={fontsReady} onHistogram={setHistogram} onPan={pan} />
        {compare && <span className="badge">Original</span>}
      </main>

      <aside className="panel">
        <nav className="tabs" role="tablist" aria-label="Herramientas">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="panel-scroll" role="tabpanel">
          {tab === 'edit' && (
            <AdjustPanel value={edit.adjustments} histogram={histogram} onChange={(adjustments) => update({ adjustments })} />
          )}
          {tab === 'crop' && <CropPanel value={edit.transform} onChange={(transform) => update({ transform })} />}
          {tab === 'frame' && (
            <FramePanel value={edit.frame} exif={photo.exif} onChange={(frame) => update({ frame })} onStyleChange={changeFrameStyle} />
          )}
          {tab === 'info' && <ExifPanel exif={photo.exif} />}
          <button type="button" className="btn btn-ghost show-mobile" onClick={onOpenAnother}>
            Abrir otra foto
          </button>
        </div>
      </aside>

      {exporting && (
        <ExportSheet
          canKeepExif={/jpe?g/i.test(photo.file.type) && Boolean(photo.exif)}
          hasGps={hasGps(photo.exif)}
          onExport={runExport}
          onClose={() => setExporting(false)}
        />
      )}
    </>
  )
}
