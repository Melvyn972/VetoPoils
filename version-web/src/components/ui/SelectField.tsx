interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
  required?: boolean
  error?: string
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  error,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-sm font-medium text-fg-primary">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-12 border border-fg-tertiary/25 bg-surface px-3 py-2.5 font-body text-sm text-fg-primary outline-none transition-colors focus:border-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="font-body text-sm text-error">{error}</p> : null}
    </div>
  )
}
