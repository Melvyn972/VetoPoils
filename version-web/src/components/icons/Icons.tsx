import type { ReactNode, SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & { className?: string }

function Svg({ children, className = 'h-5 w-5', strokeWidth = 1.75, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconHome(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 10.2 12 3.5l8.5 6.7" />
      <path d="M5.5 8.8V20h13V8.8" />
      <path d="M10 20v-5.5h4V20" />
    </Svg>
  )
}

export function IconPaw(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="6.2" cy="10" rx="1.8" ry="2.2" />
      <ellipse cx="10" cy="6.2" rx="1.8" ry="2.3" />
      <ellipse cx="14.4" cy="6.2" rx="1.8" ry="2.3" />
      <ellipse cx="18" cy="10" rx="1.8" ry="2.2" />
      <path d="M12.2 11.5c-2.6 0-5.2 3.3-5.2 5.6 0 1.6 1.2 2.4 2.6 2.4 1.1 0 1.6-.6 2.6-.6s1.6.6 2.7.6c1.4 0 2.5-.8 2.5-2.4 0-2.3-2.6-5.6-5.2-5.6Z" />
    </Svg>
  )
}

export function IconBell(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.8h-15Z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </Svg>
  )
}

export function IconShare(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="12" r="2.3" />
      <circle cx="17.5" cy="6" r="2.3" />
      <circle cx="17.5" cy="18" r="2.3" />
      <path d="m8.1 10.9 7.3-3.8M8.1 13.1l7.3 3.8" />
    </Svg>
  )
}

export function IconUser(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M5 19.6c1.3-3.2 3.9-4.9 7-4.9s5.7 1.7 7 4.9" />
    </Svg>
  )
}

export function IconUsers(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c1-2.8 3-4.3 5.5-4.3s4.5 1.5 5.5 4.3" />
      <path d="M15.5 5.8a3 3 0 0 1 0 5.6M17.5 14.9c1.4.6 2.4 2 3 4.1" />
    </Svg>
  )
}

export function IconQr(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.4" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.4" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.4" />
      <path d="M14 14h2.5v2.5H14zM18.5 14h2v2M14 19.5h2.5M20.5 18.5v2h-2" />
    </Svg>
  )
}

export function IconScan(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M7.5 12h9" />
    </Svg>
  )
}

export function IconFile(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8Z" />
      <path d="M14 3.5V8h4.5M9 12.5h6M9 16h4" />
    </Svg>
  )
}

export function IconCalendar(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </Svg>
  )
}

export function IconWallet(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5V8" />
      <rect x="4" y="7.5" width="16.5" height="12" rx="2.5" />
      <path d="M16 13.5h1.5" />
    </Svg>
  )
}

export function IconHeart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10Z" />
      <path d="M7.5 12h2.5l1.2-2.2 1.8 4.2 1.2-2H17" />
    </Svg>
  )
}

export function IconPrinter(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 8V3.5h10V8" />
      <rect x="3.5" y="8" width="17" height="8.5" rx="2" />
      <path d="M7 14h10v6.5H7z" />
    </Svg>
  )
}

export function IconDownload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
    </Svg>
  )
}

export function IconUpload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14" />
    </Svg>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  )
}

export function IconX(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </Svg>
  )
}

export function IconChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Svg>
  )
}

export function IconArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Svg>
  )
}

export function IconArrowLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
    </Svg>
  )
}

export function IconClock(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  )
}

export function IconShield(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 5 6v5.5c0 4.3 3 7.7 7 9 4-1.3 7-4.7 7-9V6Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </Svg>
  )
}

export function IconLock(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Svg>
  )
}

export function IconMail(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </Svg>
  )
}

export function IconPhone(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 17.5h2" />
    </Svg>
  )
}

export function IconStethoscope(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5v5a4.5 4.5 0 0 0 9 0v-5" />
      <path d="M10.5 13v2.5a4.5 4.5 0 0 0 9 0V13" />
      <circle cx="19.5" cy="11" r="2" />
    </Svg>
  )
}

export function IconSyringe(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m17 3.5 3.5 3.5M18.7 5.3 15 9M14 6l4 4M15.5 8.5 7 17l-2.5.5.5-2.5 8.5-8.5M9.5 11.5l1.5 1.5M7.5 13.5 9 15M4.5 19.5l1-1" />
    </Svg>
  )
}

export function IconPill(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.8" y="8.5" width="18.4" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="m9.5 9.5 5 5" />
    </Svg>
  )
}

export function IconActivity(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 12h4l2.5-6 4 12 2.5-6h4" />
    </Svg>
  )
}

export function IconBook(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v13H7.5A2.5 2.5 0 0 1 5 17.5Z" />
      <path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H17M19.5 6.5V20" />
    </Svg>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" />
    </Svg>
  )
}

export function IconLogout(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" />
      <path d="M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5" />
    </Svg>
  )
}

export function IconBuilding(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 20.5V6.5L12 3.5l7.5 3v14" />
      <path d="M3 20.5h18M10 20.5v-4h4v4M12 8v4M10 10h4" />
    </Svg>
  )
}

export function IconTrash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.9 12a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12" />
    </Svg>
  )
}

export function IconEdit(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10Z" />
      <path d="m13.5 8 2.5 2.5" />
    </Svg>
  )
}

export function IconCopy(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2.2" />
      <path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </Svg>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Svg>
  )
}

export function IconInfo(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </Svg>
  )
}

export function IconAlert(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.3 4.3 2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4.5M12 17h.01" />
    </Svg>
  )
}

export function IconMenu(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Svg>
  )
}

export function IconEye(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Svg>
  )
}

export function IconEyeOff(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.6 5.6A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4.4-1.1" />
      <path d="M9.9 9.9a2.8 2.8 0 0 0 4.2 4.2M3.5 3.5l17 17" />
    </Svg>
  )
}

export function IconHandshake(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m11 7.5-2.5-2-5 4.5 7.5 7.5a1.6 1.6 0 0 0 2.3 0l.2-.2" />
      <path d="m13 7.5 2.5-2 5 4.5-6.3 6.3a1.6 1.6 0 0 1-2.3 0L8.5 12.5l2.5-2.5a1.6 1.6 0 0 1 2.3 0l1.2 1.2" />
    </Svg>
  )
}

export function IconScale(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M8 9.5a5.6 5.6 0 0 1 8 0M12 12.5l1.5-2.5" />
    </Svg>
  )
}

export function IconSparkline(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 17.5 9 12l3.5 3.5 8-8" />
      <path d="M15.5 7.5h5v5" />
    </Svg>
  )
}

export function IconGlobe(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5s1.1-6.1 3.5-8.5Z" />
    </Svg>
  )
}

export function IconCamera(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2.5h6L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z" />
      <circle cx="12" cy="13" r="3.5" />
    </Svg>
  )
}

export function IconRefresh(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4h-4" />
    </Svg>
  )
}

export function IconExternal(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.5 4.5h6v6M19.5 4.5 11 13M17.5 13.5v4.5a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V8A1.5 1.5 0 0 1 6 6.5h4.5" />
    </Svg>
  )
}
