import { useCallback, useMemo, useState } from 'react'
import type { Adjustments, FrameSettings, LoadedPhoto, Transform } from '../types'
import { neutralAdjustments } from '../lib/adjust'
import { infoFromExif } from '../lib/exif'
import { getFrameStyle } from '../lib/frame'
import type { Histogram } from '../lib/pipeline'
import { exportImage, hasGps, naturalExportSize, type ExportOptions } from '../lib/render'
import { saveBlob } from '../lib/save'
import { useHistory } from '../hooks/useHistory'
import { useUndoKeys } from '../hooks/useUndoKeys'
import { AdjustPanel } from './AdjustPanel'
import { CropPanel } from './CropPanel'
import { ExifPanel } from './ExifPanel'
import { ExportSheet } from './ExportSheet'
import { FramePanel } from './FramePanel'
import { Stage } from './Stage'
import { ToolRail, type Tool } from './ToolRail'
import { TopBar } from './TopBar'
import { IconCompare, IconCrop, IconFrame, IconImage, IconInfo, IconSliders } from './icons'

interface EditState {
  adjustments: Adjustments
  transform: Transform
  frame: FrameSettings
}

type Tab = 'edit' | 'crop' | 'frame' | 'info'

const TOOLS: Tool<Tab>[] = [
  { id: 'edit', label: 'Editar', icon: <IconSliders /> },
  { id: 'crop', label: 'Recortar', icon: <IconCrop /> },
  { id: 'frame', label: 'Marco', icon: <IconFrame /> },
  { id: 'info', label: 'Datos', icon: <IconInfo /> },
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
      metaFont: 'typewriter',
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
  const [tool, setTool] = useState<Tab | null>('edit')
  const [chrome, setChrome] = useState(true)
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
      </TopBar>

      <main className="stage">
        <Stage input={renderInput} fontsReady={fontsReady} onHistogram={setHistogram} onPan={pan} onTap={() => setChrome((c) => !c)} />
        {compare && <span className="badge">Original</span>}
      </main>

      {tool && (
        <aside className="panel" key={tool}>
          <div className="panel-scroll">
            {tool === 'edit' && (
              <AdjustPanel value={edit.adjustments} histogram={histogram} onChange={(adjustments) => update({ adjustments })} />
            )}
            {tool === 'crop' && <CropPanel value={edit.transform} onChange={(transform) => update({ transform })} />}
            {tool === 'frame' && (
              <FramePanel value={edit.frame} exif={photo.exif} onChange={(frame) => update({ frame })} onStyleChange={changeFrameStyle} />
            )}
            {tool === 'info' && <ExifPanel exif={photo.exif} />}
          </div>
        </aside>
      )}

      <ToolRail tools={TOOLS} active={tool} onSelect={setTool} label="Herramientas" />

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
