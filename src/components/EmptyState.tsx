interface EmptyStateProps {
  onPick: () => void
  onPickMany: () => void
  error: string | null
  loading: boolean
}

export function EmptyState({ onPick, onPickMany, error, loading }: EmptyStateProps) {
  return (
    <div className="empty">
      <button type="button" className="empty-polaroid" onClick={onPick} disabled={loading}>
        <span className="empty-photo" aria-hidden="true" />
        <span className="empty-caption">{loading ? 'Revelando…' : 'Elige una foto'}</span>
      </button>
      <p className="empty-text">
        O arrástrala aquí. Lee los datos EXIF de tu cámara, ajusta luz y color, y expórtala con su marco.
      </p>
      <button type="button" className="btn" onClick={onPickMany} disabled={loading}>
        Crear un collage con varias fotos
      </button>
      <p className="empty-note">Tus fotos se procesan en este dispositivo y no se suben a ningún servidor.</p>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
