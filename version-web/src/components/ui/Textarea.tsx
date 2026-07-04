import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  const textareaId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textareaId} className="font-body text-sm text-fg-secondary">
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={4}
        className={[
          'w-full resize-none rounded-12 border border-fg-tertiary/30 bg-surface px-3 py-2.5 font-body text-sm text-fg-primary',
          'placeholder:text-fg-tertiary focus:border-primary focus:outline-none',
          error ? 'border-error' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="font-body text-sm text-error">{error}</p>}
    </div>
  )
}
