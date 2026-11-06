export const fieldLabel = 'font-body text-[13px] font-medium text-[#3a3f3d]'

export function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

export function fieldControl(hasError?: boolean, extra = '') {
  return [
    'w-full rounded-[14px] border bg-white font-body text-[15px] text-ink shadow-[0_1px_0_rgb(16_24_40/0.03)]',
    'placeholder:text-[#9aa3a0] transition-[border-color,box-shadow] duration-200',
    'hover:border-[#c9d3cf] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/12',
    'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted',
    hasError ? 'border-red-ink/60 focus:border-red-ink focus:ring-red-ink/10' : 'border-[#dde3e1]',
    extra,
  ]
    .filter(Boolean)
    .join(' ')
}
