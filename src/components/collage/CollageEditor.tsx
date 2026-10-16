import { useCallback, useRef, useState } from 'react'
import type { CollageCell, CollageSettings, CollageState, LoadedPhoto } from '../../types'
import { neutralAdjustments } from '../../lib/adjust'
import { MAX_PHOTOS } from '../../lib/collageLayouts'
import { exportCollage } from '../../lib/collageRender'
import { loadPhoto } from '../../lib/image'
import { saveBlob } from '../../lib/save'
import { useHistory } from '../../hooks/useHistory'
import { useUndoKeys } from '../../hooks/useUndoKeys'
import { ExportSheet } from '../ExportSheet'
import { TopBar } from '../TopBar'
import { CellPanel } from './CellPanel'
import { BackgroundPanel, LayoutPanel, StylePanel } from './CollagePanels'
import { CollageStage } from './CollageStage'

type Tab = 'layout' | 'background' | 'style' | 'photo'

const TABS: { id: Tab; label: string }[] = [
  { id: 'layout', label: 'Diseño' },
  { id: 'background', label: 'Fondo' },
  { id: 'style', label: 'Estilo' },
  { id: 'photo', label: 'Foto' },
]

let nextId = 0
function makeCell(photo: LoadedPhoto): CollageCell {
  nextId += 1
  return { id: `cell-${nextId}`, photo, adjustments: neutralAdjustments(), zoom: 1, panX: 0, panY: 0 }
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
  const [tab, setTab] = useState<Tab>('layout')
  const [selected, setSelected] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const replacing = useRef<number | null>(null)
  const history = useHistory<CollageState>({ cells: photos.map(makeCell), settings: DEFAULT_SETTINGS })
  const state = history.state
  const { cells, settings } = state
  useUndoKeys(history.undo, history.redo)

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

  const selectCell = (index: number | null) => {
    setSelected(index)
    if (index !== null) setTab('photo')
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
    if (loaded.length < files.length) setError('Algunas imágenes no se pudieron abrir. Si son HEIC, conviértelas a JPG.')
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
    const adj = cells[selected].adjustments
    setCells(cells.map((c) => ({ ...c, adjustments: adj })))
  }

  const runExport = async (opts: { format: 'image/jpeg' | 'image/png' }, mode: 'download' | 'share') => {
    const blob = await exportCollage(state, opts.format)
    await saveBlob(blob, `collage.${opts.format === 'image/png' ? 'png' : 'jpg'}`, mode)
  }

  const cell = selected !== null ? cells[selected] ?? null : null

  return (
    <>
      <TopBar onHome={onHome} history={history} onExport={() => setExporting(true)} />

      <main className="stage">
        <CollageStage state={state} selected={selected} fontsReady={fontsReady} onSelect={selectCell} onPanCell={panCell} />
        {error && (
          <button type="button" className="toast" role="alert" onClick={() => setError(null)}>
            {error}
          </button>
        )}
      </main>

      <aside className="panel">
        <nav className="tabs" role="tablist" aria-label="Herramientas del collage">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="panel-scroll" role="tabpanel">
          {tab === 'layout' && <LayoutPanel value={settings} onChange={setSettings} count={cells.length} onAdd={() => pick(null)} />}
          {tab === 'background' && <BackgroundPanel value={settings} onChange={setSettings} count={cells.length} />}
          {tab === 'style' && <StylePanel value={settings} onChange={setSettings} />}
          {tab === 'photo' && (
            <CellPanel
              cell={cell}
              index={selected ?? 0}
              count={cells.length}
              onChange={(c) => selected !== null && updateCell(selected, c)}
              onMove={move}
              onReplace={() => pick(selected)}
              onRemove={remove}
              onApplyToAll={applyToAll}
            />
          )}
        </div>
      </aside>

      <input
        ref={fileInput}
        type="file"
        accept="image/*,.heic,.heif"
        hidden
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />

      {exporting && (
        <ExportSheet exifOptions={false} canKeepExif={false} hasGps={false} onExport={runExport} onClose={() => setExporting(false)} />
      )}
    </>
  )
}
