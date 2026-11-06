import { useId, useRef } from 'react'

export function FileField({
  label,
  hint,
  accept,
  file,
  onFile,
}: {
  label: string
  hint?: string
  accept: string
  file: File | null
  onFile: (file: File | null) => void
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line bg-white p-4">
      <span className="font-body text-sm font-medium text-ink">{label}</span>
      {hint ? <p className="font-body text-xs text-muted">{hint}</p> : null}
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={id}
          className="cursor-pointer rounded-xl bg-primary-15 px-4 py-2 font-body text-sm font-semibold text-primary"
        >
          Choisir un fichier
        </label>
        <span className="font-body text-sm text-muted">
          {file ? file.name : 'Aucun fichier sélectionné'}
        </span>
        {file ? (
          <button
            type="button"
            className="font-body text-xs text-muted underline"
            onClick={() => {
              onFile(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
          >
            Retirer
          </button>
        ) : null}
      </div>
    </div>
  )
}
