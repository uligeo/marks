import { useCallback, useRef, useState } from 'react'
import type { CollageCell, CollageSettings, CollageState, LoadedPhoto } from '../../types'
import { neutralAdjustments } from '../../lib/adjust'
import { MAX_PHOTOS } from '../../lib/collageLayouts'
import { exportCollage, naturalCollageSize } from '../../lib/collageRender'
import type { ExportOptions } from '../../lib/render'
import { loadPhoto } from '../../lib/image'
import { saveBlob } from '../../lib/save'
import { useHistory } from '../../hooks/useHistory'
import { useUndoKeys } from '../../hooks/useUndoKeys'
import { ExportSheet } from '../ExportSheet'
import { ToolRail, type Tool } from '../ToolRail'
import { TopBar } from '../TopBar'
import { IconFill, IconImage, IconLayout, IconStyle, IconText } from '../icons'
import { LayersPanel } from '../LayersPanel'
import { NO_LOOK } from '../../lib/filters'
import { useLayers } from '../../hooks/useLayers'
import { CellPanel } from './CellPanel'
import { BackgroundPanel, LayoutPanel, StylePanel } from './CollagePanels'
import { CollageStage } from './CollageStage'

type Tab = 'layout' | 'background' | 'style' | 'photo' | 'layers'

const TOOLS: Tool<Tab>[] = [
  { id: 'layout', label: 'Diseño', icon: <IconLayout /> },
  { id: 'background', label: 'Fondo', icon: <IconFill /> },
  { id: 'style', label: 'Estilo', icon: <IconStyle /> },
  { id: 'photo', label: 'Foto', icon: <IconImage /> },
  { id: 'layers', label: 'Texto', icon: <IconText /> },
]

let nextId = 0
function makeCell(photo: LoadedPhoto): CollageCell {
  nextId += 1
  return { id: `cell-${nextId}`, photo, adjustments: neutralAdjustments(), look: NO_LOOK, zoom: 1, panX: 0, panY: 0 }
}

const DEFAULT_SETTINGS: CollageSettings = {
  layoutId: '',
  aspect: 4 / 5,
  gap: 0.02,
  margin: 0.04,
  radius: 0,
  background: 'color',
  color: '#fbfbf8',
  gradient: 0,
  blurSource: 0,
  caption: '',
  font: 'hand',
}

const clampPan = (v: number): number => Math.max(-1, Math.min(1, v))

interface CollageEditorProps {
  photos: LoadedPhoto[]
  fontsReady: boolean
  onHome: () => void
}

export function CollageEditor({ photos, fontsReady, onHome }: CollageEditorProps) {
  const [tool, setTool] = useState<Tab | null>('layout')
  const [chrome, setChrome] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const replacing = useRef<number | null>(null)
  const history = useHistory<CollageState>({ cells: photos.map(makeCell), settings: DEFAULT_SETTINGS, layers: [] })
  const state = history.state
  const { cells, settings } = state
  useUndoKeys(history.undo, history.redo)

  const layers = useLayers(state.layers, (next) => history.set({ ...state, layers: next }), () => setTool('layers'))
  const setSettings = (patch: Partial<CollageSettings>) => history.set({ ...state, settings: { ...settings, ...patch } })
  const setCells = (next: CollageCell[], select: number | null = selected) => {
    history.set({ ...state, cells: next, settings: { ...settings, blurSource: Math.min(settings.blurSource, next.length - 1) } })
    setSelected(select !== null && select < next.length ? select : null)
  }
  const updateCell = (index: number, cell: CollageCell) => setCells(cells.map((c, i) => (i === index ? cell : c)), index)

  const panCell = useCallback(
    (index: number, dx: number, dy: number) => {
      const c = state.cells[index]
      const next = { ...c, panX: clampPan(c.panX + dx), panY: clampPan(c.panY + dy) }
      history.set({ ...state, cells: state.cells.map((x, i) => (i === index ? next : x)) })
    },
    [history, state],
  )

  const zoomCell = useCallback(
    (index: number, ratio: number) => {
      const c = state.cells[index]
      const next = { ...c, zoom: Math.max(1, Math.min(3, c.zoom * ratio)) }
      history.set({ ...state, cells: state.cells.map((x, i) => (i === index ? next : x)) })
    },
    [history, state],
  )

  const selectCell = (index: number | null) => {
    setSelected(index)
    setChrome(true)
    if (index !== null) setTool('photo')
  }

  const tapBackground = () => {
    if (selected !== null) setSelected(null)
    else setChrome((c) => !c)
  }

  const pick = (replaceIndex: number | null) => {
    replacing.current = replaceIndex
    if (fileInput.current) {
      fileInput.current.multiple = replaceIndex === null
      fileInput.current.click()
    }
  }

  const onFiles = async (files: File[]) => {
    setError(null)
    const loaded = (await Promise.allSettled(files.map(loadPhoto)))
      .filter((r): r is PromiseFulfilledResult<LoadedPhoto> => r.status === 'fulfilled')
      .map((r) => r.value)
    if (loaded.length < files.length) setError('Algunas imágenes no se pudieron abrir. Se admiten JPG, PNG, WebP, HEIC (en Safari) y RAW CR3.')
    if (!loaded.length) return
    const index = replacing.current
    if (index !== null) {
      updateCell(index, { ...makeCell(loaded[0]), adjustments: cells[index].adjustments })
    } else {
      const room = MAX_PHOTOS - cells.length
      if (loaded.length > room) setError(`El collage admite hasta ${MAX_PHOTOS} fotos; se agregaron ${room}.`)
      setCells([...cells, ...loaded.slice(0, room).map(makeCell)])
    }
  }

  const swap = (a: number, b: number) => {
    const next = [...cells]
    ;[next[a], next[b]] = [next[b], next[a]]
    setCells(next, b)
  }

  const move = (delta: -1 | 1) => {
    if (selected === null) return
    const target = selected + delta
    const next = [...cells]
    ;[next[selected], next[target]] = [next[target], next[selected]]
    setCells(next, target)
  }

  const remove = () => {
    if (selected === null) return
    setCells(cells.filter((_, i) => i !== selected), null)
  }

  const applyToAll = () => {
    if (selected === null) return
    const { adjustments, look } = cells[selected]
    setCells(cells.map((c) => ({ ...c, adjustments, look })))
  }

  const runExport = async (opts: ExportOptions, mode: 'download' | 'share') => {
    const result = await exportCollage(state, opts)
    await saveBlob(result.blob, `collage.${opts.format === 'image/png' ? 'png' : 'jpg'}`, mode)
    return result
  }

  const cell = selected !== null ? cells[selected] ?? null : null

  return (
    <div className="editor" data-chrome={chrome ? 'visible' : 'hidden'}>
      <TopBar onHome={onHome} history={history} onExport={() => setExporting(true)} />

      <main className="stage">
        <CollageStage state={state} selected={selected} fontsReady={fontsReady} layers={layers.gestures} onSelect={selectCell}
          onPanCell={panCell} onZoomCell={zoomCell} onSwapCells={swap} onTapBackground={tapBackground} />
        {error && (
          <button type="button" className="toast" role="alert" onClick={() => setError(null)}>
            {error}
          </button>
        )}
      </main>

      {tool && (
        <aside className="panel" key={tool}>
          <div className="panel-scroll">
            {tool === 'layout' && <LayoutPanel value={settings} onChange={setSettings} count={cells.length} onAdd={() => pick(null)} />}
            {tool === 'background' && <BackgroundPanel value={settings} onChange={setSettings} count={cells.length} />}
            {tool === 'style' && <StylePanel value={settings} onChange={setSettings} />}
            {tool === 'photo' && (
              <CellPanel
                cell={cell}
                index={selected ?? 0}
                count={cells.length}
                onChange={(c) => selected !== null && updateCell(selected, c)}
                onMove={move}
                onReplace={() => pick(selected)}
                onRemove={remove}
                onApplyToAll={applyToAll}
                onAdd={() => pick(null)}
              />
            )}
            {tool === 'layers' && (
              <LayersPanel layers={state.layers} selected={layers.selected} onChange={layers.change} onSelect={layers.select} />
            )}
          </div>
        </aside>
      )}

      <ToolRail tools={TOOLS} active={tool} onSelect={setTool} label="Herramientas del collage" />

      <input
        ref={fileInput}
        type="file"
        accept="image/*,.heic,.heif,.cr3"
        hidden
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />

      {exporting && (
        <ExportSheet naturalSize={naturalCollageSize(state)} exifOptions={false} canKeepExif={false} hasGps={false} onExport={runExport} onClose={() => setExporting(false)} />
      )}
    </div>
  )
}
