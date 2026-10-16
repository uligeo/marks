import { useEffect, useRef, useState } from 'react'
import type { LoadedPhoto } from './types'
import { loadCanvasFonts } from './lib/fonts'
import { loadPhoto } from './lib/image'
import { MAX_PHOTOS } from './lib/collageLayouts'
import { CollageEditor } from './components/collage/CollageEditor'
import { EmptyState } from './components/EmptyState'
import { PhotoEditor } from './components/PhotoEditor'
import { TopBar } from './components/TopBar'

type Mode = { kind: 'home' } | { kind: 'photo'; photo: LoadedPhoto; key: number } | { kind: 'collage'; photos: LoadedPhoto[] }

const isImage = (f: File): boolean => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)

export default function App() {
  const [mode, setMode] = useState<Mode>({ kind: 'home' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadCanvasFonts().then(() => setFontsReady(true))
  }, [])

  const openFiles = async (files: File[]) => {
    const images = files.filter(isImage).slice(0, MAX_PHOTOS)
    if (!images.length) {
      if (files.length) setError('Ese archivo no es una imagen. Elige fotos JPG, PNG o WebP.')
      return
    }
    setLoading(true)
    setError(null)
    const results = await Promise.allSettled(images.map(loadPhoto))
    const photos = results
      .filter((r): r is PromiseFulfilledResult<LoadedPhoto> => r.status === 'fulfilled')
      .map((r) => r.value)
    setLoading(false)
    if (!photos.length) {
      setError('Este navegador no puede abrir esa imagen. Si es HEIC, conviértela a JPG o usa Safari.')
      return
    }
    setMode(photos.length === 1 && images.length === 1 && !fileInput.current?.multiple
      ? { kind: 'photo', photo: photos[0], key: Date.now() }
      : { kind: 'collage', photos })
  }

  const pick = (multiple: boolean) => {
    if (!fileInput.current) return
    fileInput.current.multiple = multiple
    fileInput.current.click()
  }

  const goHome = () => {
    if (window.confirm('¿Volver al inicio? Se perderán los cambios que no hayas exportado.')) setMode({ kind: 'home' })
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (mode.kind !== 'home') return
    if (fileInput.current) fileInput.current.multiple = e.dataTransfer.files.length > 1
    openFiles(Array.from(e.dataTransfer.files))
  }

  return (
    <div
      className="app"
      data-has-photo={mode.kind !== 'home'}
      data-drag={dragOver && mode.kind === 'home'}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {mode.kind === 'home' && (
        <>
          <TopBar />
          <main className="stage">
            <EmptyState onPick={() => pick(false)} onPickMany={() => pick(true)} error={error} loading={loading} />
          </main>
        </>
      )}
      {mode.kind === 'photo' && (
        <PhotoEditor key={mode.key} photo={mode.photo} fontsReady={fontsReady} onHome={goHome} onOpenAnother={() => pick(false)} />
      )}
      {mode.kind === 'collage' && <CollageEditor photos={mode.photos} fontsReady={fontsReady} onHome={goHome} />}

      <input
        ref={fileInput}
        type="file"
        accept="image/*,.heic,.heif"
        hidden
        onChange={(e) => {
          openFiles(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
    </div>
  )
}
