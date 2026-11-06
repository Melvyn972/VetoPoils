import { IconAlert } from '../icons/Icons'

export function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="flex items-start gap-1.5 font-body text-[13px] font-medium text-red-ink">
        <IconAlert className="mt-px h-3.5 w-3.5 shrink-0" />
        {error}
      </p>
    )
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="font-body text-xs leading-relaxed text-muted">
        {hint}
      </p>
    )
  }
  return null
}
