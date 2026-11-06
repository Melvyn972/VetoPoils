import { useId, useRef, useState, type DragEvent } from 'react'

import { IconFile, IconUpload, IconX } from '../icons/Icons'

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
}

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
  const [dragging, setDragging] = useState(false)

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) onFile(dropped)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-body text-[13px] font-medium text-[#3a3f3d]">{label}</span>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        className="peer sr-only"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          'rounded-[16px] border border-dashed p-4 transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-primary/15',
          dragging ? 'border-primary bg-mint-soft' : 'border-[#cfd8d4] bg-[#fbfcfc]',
        ].join(' ')}
      >
        {file ? (
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-mint text-primary">
              <IconFile />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-sm font-semibold text-ink">{file.name}</p>
              <p className="font-body text-xs text-muted">{formatSize(file.size)}</p>
            </div>
            <label
              htmlFor={id}
              className="press cursor-pointer rounded-[10px] px-2.5 py-1.5 font-body text-xs font-semibold text-primary hover:bg-mint"
            >
              Changer
            </label>
            <button
              type="button"
              aria-label="Retirer"
              className="press flex h-8 w-8 items-center justify-center rounded-[10px] text-muted hover:bg-red-soft hover:text-red-ink"
              onClick={() => {
                onFile(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2 text-center sm:flex-row sm:text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-card">
              <IconUpload className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm text-ink">
                <label htmlFor={id} className="cursor-pointer font-semibold text-primary underline-offset-2 hover:underline">
                  Choisir un fichier
                </label>{' '}
                <span className="text-muted">ou le déposer ici</span>
              </p>
              <p className="font-body text-xs text-muted">{hint ?? 'Aucun fichier sélectionné'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
