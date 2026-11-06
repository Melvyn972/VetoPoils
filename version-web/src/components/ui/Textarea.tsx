import { useId, type TextareaHTMLAttributes } from 'react'

import { FieldMessage } from './FieldMessage'
import { describedBy, fieldControl, fieldLabel } from './fieldStyles'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, id, className = '', rows = 4, ...props }: TextareaProps) {
  const autoId = useId()
  const textareaId = id ?? autoId

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textareaId} className={fieldLabel}>
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, error, hint)}
        className={fieldControl(Boolean(error), `resize-y px-3.5 py-3 leading-relaxed ${className}`)}
        {...props}
      />
      <FieldMessage id={textareaId} error={error} hint={hint} />
    </div>
  )
}
