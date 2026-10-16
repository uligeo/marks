import { useState } from 'react'
import type { ExportOptions } from '../lib/render'

interface ExportSheetProps {
  /** False hides the metadata options entirely (collages). */
  exifOptions?: boolean
  canKeepExif: boolean
  hasGps: boolean
  onExport: (opts: ExportOptions, mode: 'download' | 'share') => Promise<void>
  onClose: () => void
}

const canShareFiles =
  typeof navigator !== 'undefined' &&
  typeof navigator.canShare === 'function' &&
  navigator.canShare({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] })

export function ExportSheet({ exifOptions = true, canKeepExif, hasGps, onExport, onClose }: ExportSheetProps) {
  const [opts, setOpts] = useState<ExportOptions>({ format: 'image/jpeg', keepExif: true, keepGps: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const exifAvailable = canKeepExif && opts.format === 'image/jpeg'

  const run = async (mode: 'download' | 'share') => {
    setBusy(true)
    setError(null)
    try {
      await onExport(opts, mode)
      onClose()
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('No se pudo exportar la imagen. Prueba con PNG o una foto más pequeña.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="export-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="export-title">Exportar foto</h2>
        <div className="segmented" role="group" aria-label="Formato">
          <button type="button" aria-pressed={opts.format === 'image/jpeg'} onClick={() => setOpts({ ...opts, format: 'image/jpeg' })}>
            JPG
          </button>
          <button type="button" aria-pressed={opts.format === 'image/png'} onClick={() => setOpts({ ...opts, format: 'image/png' })}>
            PNG
          </button>
        </div>
        {exifOptions && (
          <label className="toggle">
            <input type="checkbox" disabled={!exifAvailable} checked={exifAvailable && opts.keepExif}
              onChange={(e) => setOpts({ ...opts, keepExif: e.target.checked })} />
            <span>Conservar los datos EXIF originales</span>
          </label>
        )}
        {exifOptions && hasGps && (
          <label className="toggle">
            <input type="checkbox" disabled={!exifAvailable || !opts.keepExif} checked={exifAvailable && opts.keepExif && opts.keepGps}
              onChange={(e) => setOpts({ ...opts, keepGps: e.target.checked })} />
            <span>Incluir la ubicación GPS</span>
          </label>
        )}
        {exifOptions && !canKeepExif && <p className="hint">Sólo se pueden conservar los EXIF de fotos JPG.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          {canShareFiles && (
            <button type="button" className="btn" onClick={() => run('share')} disabled={busy}>Compartir</button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => run('download')} disabled={busy}>
            {busy ? 'Generando…' : 'Descargar'}
          </button>
        </div>
      </div>
    </div>
  )
}
