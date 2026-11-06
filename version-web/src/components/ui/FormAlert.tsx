import type { ReactNode } from 'react'

import { IconAlert, IconCheck, IconInfo } from '../icons/Icons'

interface FormAlertProps {
  children: ReactNode
  variant?: 'error' | 'info' | 'success'
  title?: string
}

const styles = {
  error: { box: 'border-red-ink/15 bg-red-soft text-[#7d231c]', icon: 'text-red-ink', Icon: IconAlert },
  info: { box: 'border-primary/15 bg-mint-soft text-[#1f4a43]', icon: 'text-primary', Icon: IconInfo },
  success: { box: 'border-green-ink/15 bg-green-soft text-[#1f5226]', icon: 'text-green-ink', Icon: IconCheck },
}

export function FormAlert({ children, variant = 'error', title }: FormAlertProps) {
  const { box, icon, Icon } = styles[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-[14px] border px-4 py-3 font-body text-sm leading-relaxed ${box}`}
    >
      <Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${icon}`} />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  )
}
