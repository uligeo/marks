import type { ExifSummary } from '../types'
import { cameraName, formatCoord, formatShutter } from '../lib/exif'

interface ExifPanelProps {
  exif: ExifSummary | null
}

function formatRaw(v: unknown): string {
  if (v instanceof Date) return v.toLocaleString('es-MX')
  if (v instanceof Uint8Array || ArrayBuffer.isView(v)) return '[datos binarios]'
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'object' && v !== null) return JSON.stringify(v)
  return String(v)
}

export function ExifPanel({ exif }: ExifPanelProps) {
  if (!exif) {
    return (
      <div className="panel-body">
        <p className="hint">
          Esta imagen no tiene metadatos EXIF. Suele pasar con capturas de pantalla o fotos enviadas por apps de
          mensajería, que los eliminan.
        </p>
      </div>
    )
  }

  const rows: [string, string | undefined][] = [
    ['Cámara', cameraName(exif) || undefined],
    ['Objetivo', exif.lens],
    ['Distancia focal', exif.focalLength ? `${Math.round(exif.focalLength)} mm` : undefined],
    ['Apertura', exif.fNumber ? `f/${exif.fNumber}` : undefined],
    ['Velocidad', exif.exposureTime ? formatShutter(exif.exposureTime) : undefined],
    ['ISO', exif.iso?.toString()],
    ['Fecha', exif.date?.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })],
    ['Dimensiones', exif.width && exif.height ? `${exif.width} × ${exif.height} px` : undefined],
    ['Software', exif.software],
  ]
  const hasGps = exif.latitude !== undefined && exif.longitude !== undefined

  return (
    <div className="panel-body">
      <dl className="exif-list">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
        {hasGps && (
          <div>
            <dt>Ubicación</dt>
            <dd>
              {formatCoord(exif.latitude!, true)}, {formatCoord(exif.longitude!, false)}
              {exif.altitude !== undefined && <> · {Math.round(exif.altitude)} m</>}
              <br />
              <a
                href={`https://www.openstreetmap.org/?mlat=${exif.latitude}&mlon=${exif.longitude}#map=16/${exif.latitude}/${exif.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver en el mapa
              </a>
            </dd>
          </div>
        )}
      </dl>
      <details className="exif-raw">
        <summary>Todos los campos ({Object.keys(exif.raw).length})</summary>
        <dl>
          {Object.entries(exif.raw).map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{formatRaw(v)}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  )
}
