import { useRef, useState } from 'react'

interface StickerPickerProps {
  onPick: (content: { emoji: string } | { image: ImageBitmap }) => void
}

const STICKERS = [
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '✨', '⭐', '🌟', '💫', '🔥', '🌈', '☀️', '🌙',
  '☁️', '⚡', '❄️', '🌊', '🌸', '🌻', '🌹', '🌴', '🍃', '🍂', '🌵', '🏔️', '🏖️', '🏝️', '🌅', '🌄',
  '📍', '🗺️', '🧭', '✈️', '🚗', '🚲', '⛵', '📷', '📸', '🎞️', '🎬', '🎵', '🎶', '🎉', '🎈', '🎁',
  '🍕', '🍔', '🌮', '🍦', '🍩', '☕', '🍹', '🍷', '😀', '😎', '🥰', '😂', '😍', '🤩', '😴', '🙌',
  '👍', '👏', '🤘', '✌️', '🐶', '🐱', '🦋', '🐢', '🐬', '🦜', '💯', '✅', '❗', '➡️', '⬆️', '🏷️',
]

export function StickerPicker({ onPick }: StickerPickerProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      // For an animated GIF this keeps its first frame.
      onPick({ image: await createImageBitmap(file) })
    } catch {
      setError('No se pudo abrir esa imagen. Usa PNG, JPG, WebP o GIF.')
    }
  }

  return (
    <div className="sticker-picker">
      <div className="sticker-grid" role="group" aria-label="Stickers">
        {STICKERS.map((emoji) => (
          <button key={emoji} type="button" className="sticker-option" onClick={() => onPick({ emoji })} aria-label={`Sticker ${emoji}`}>
            {emoji}
          </button>
        ))}
      </div>
      <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
        Subir imagen o GIF como sticker
      </button>
      <p className="hint">Las imágenes PNG con fondo transparente quedan mejor. De un GIF se usa el primer cuadro.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/gif,image/webp,image/jpeg,image/svg+xml"
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
