import { useMemo, useState } from 'react'
import type { ExportOptions } from '../lib/render'
import { RESOLUTIONS, fitScale, formatSize, resolutionScale, type ExportResult, type Size } from '../lib/quality'

interface ExportSheetProps {
  /** Output size at full native resolution. */
  naturalSize: Size
  /** False hides the metadata options entirely (collages). */
  exifOptions?: boolean
  canKeepExif: boolean
  hasGps: boolean
  onExport: (opts: ExportOptions, mode: 'download' | 'share') => Promise<ExportResult>
  onClose: () => void
}

const canShareFiles =
  typeof navigator !== 'undefined' &&
  typeof navigator.canShare === 'function' &&
  navigator.canShare({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] })

const scaled = (s: Size, k: number): Size => ({ w: Math.round(s.w * k), h: Math.round(s.h * k) })

export function ExportSheet({ naturalSize, exifOptions = true, canKeepExif, hasGps, onExport, onClose }: ExportSheetProps) {
  const [opts, setOpts] = useState<ExportOptions>({
    format: 'image/jpeg',
    resolution: 'original',
    quality: 'max',
    keepExif: true,
    keepGps: false,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<ExportResult | null>(null)
  const exifAvailable = canKeepExif && opts.format === 'image/jpeg'
  const set = (patch: Partial<ExportOptions>) => setOpts({ ...opts, ...patch })

  const target = scaled(naturalSize, resolutionScale(naturalSize, opts.resolution))
  const fit = useMemo(() => fitScale(target.w, target.h), [target.w, target.h])

  const run = async (mode: 'download' | 'share') => {
    setBusy(true)
    setError(null)
    try {
      setDone(await onExport(opts, mode))
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('No se pudo exportar la imagen. Prueba con una resolución menor.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="export-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="export-title">Exportar</h2>

        {done ? (
          <>
            <p className="export-done">Exportada a {formatSize(done.size)}.</p>
            {done.limited && (
              <p className="hint">Este navegador no admite una imagen más grande, así que se redujo al máximo posible.</p>
            )}
            <div className="sheet-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>Listo</button>
            </div>
          </>
        ) : (
          <>
            <fieldset className="field">
              <legend>Resolución</legend>
              <div className="resolution-grid">
                {RESOLUTIONS.map((r) => {
                  const k = resolutionScale(naturalSize, r.id)
                  return (
                    <button key={r.id} type="button" className="resolution" aria-pressed={opts.resolution === r.id}
                      onClick={() => set({ resolution: r.id })}>
                      <span className="resolution-name">{r.label}</span>
                      <span className="resolution-size">
                        {Math.round(naturalSize.w * k)} × {Math.round(naturalSize.h * k)}
                        {k > 1.01 && ' · ampliada'}
                      </span>
                    </button>
                  )
                })}
              </div>
              {fit < 1 && (
                <p className="hint">
                  Este navegador admite como máximo {formatSize(scaled(target, fit))}; se exportará a ese tamaño.
                </p>
              )}
            </fieldset>

            <div className="segmented" role="group" aria-label="Formato">
              <button type="button" aria-pressed={opts.format === 'image/jpeg'} onClick={() => set({ format: 'image/jpeg' })}>JPG</button>
              <button type="button" aria-pressed={opts.format === 'image/png'} onClick={() => set({ format: 'image/png' })}>PNG sin pérdida</button>
            </div>
            {opts.format === 'image/jpeg' && (
              <div className="segmented" role="group" aria-label="Calidad JPG">
                <button type="button" aria-pressed={opts.quality === 'max'} onClick={() => set({ quality: 'max' })}>Calidad máxima</button>
                <button type="button" aria-pressed={opts.quality === 'high'} onClick={() => set({ quality: 'high' })}>Alta, más ligera</button>
              </div>
            )}

            {exifOptions && (
              <label className="toggle">
                <input type="checkbox" disabled={!exifAvailable} checked={exifAvailable && opts.keepExif}
                  onChange={(e) => set({ keepExif: e.target.checked })} />
                <span>Conservar los datos EXIF originales</span>
              </label>
            )}
            {exifOptions && hasGps && (
              <label className="toggle">
                <input type="checkbox" disabled={!exifAvailable || !opts.keepExif} checked={exifAvailable && opts.keepExif && opts.keepGps}
                  onChange={(e) => set({ keepGps: e.target.checked })} />
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
          </>
        )}
      </div>
    </div>
  )
}
