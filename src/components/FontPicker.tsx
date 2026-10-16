import type { FontOption } from '../lib/fonts'

interface FontPickerProps {
  label: string
  fonts: FontOption[]
  value: string
  onChange: (id: string) => void
}

/** Horizontal list of fonts, each previewed in its own typeface. */
export function FontPicker({ label, fonts, value, onChange }: FontPickerProps) {
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="font-picker" role="group" aria-label={label}>
        {fonts.map((f) => (
          <button
            key={f.id}
            type="button"
            className="font-option"
            aria-pressed={value === f.id}
            style={{ fontFamily: f.family, fontWeight: f.bold }}
            onClick={() => onChange(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
