interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format?: (value: number) => string
  neutral?: number
}

const defaultFormat = (v: number): string => (v > 0 ? `+${Math.round(v * 100)}` : `${Math.round(v * 100)}`)

export function Slider({ label, value, min, max, step = 0.01, onChange, format = defaultFormat, neutral = 0 }: SliderProps) {
  const changed = Math.abs(value - neutral) > 1e-6
  return (
    <label className="slider">
      <span className="slider-head">
        <span>{label}</span>
        <button
          type="button"
          className="slider-value"
          data-changed={changed}
          onClick={() => onChange(neutral)}
          title="Restablecer"
          disabled={!changed}
        >
          {format(value)}
        </button>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onDoubleClick={() => onChange(neutral)}
      />
    </label>
  )
}
