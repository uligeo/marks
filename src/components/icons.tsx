import type { ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconBack = () => <Icon><path d="M15 5l-7 7 7 7" /></Icon>
export const IconUndo = () => <Icon><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 010 12h-3" /></Icon>
export const IconRedo = () => <Icon><path d="M15 14l5-5-5-5" /><path d="M20 9H10a6 6 0 000 12h3" /></Icon>
export const IconCompare = () => <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 4v16" /><path d="M12 8l9 8" /></Icon>
export const IconExport = () => <Icon><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M5 20h14" /></Icon>
export const IconImage = () => <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></Icon>

export const IconSliders = () => (
  <Icon>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Icon>
)
export const IconCrop = () => <Icon><path d="M6 2v14a2 2 0 002 2h14" /><path d="M2 6h14a2 2 0 012 2v14" /></Icon>
export const IconFrame = () => <Icon><rect x="4" y="3" width="16" height="18" rx="1" /><rect x="7" y="6" width="10" height="9" /></Icon>
export const IconInfo = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7.5v.01" /></Icon>

export const IconPresets = () => (
  <Icon>
    <path d="M4 20l10-10" />
    <path d="M15 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    <path d="M19 12l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" />
  </Icon>
)
export const IconLight = () => (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
)
export const IconColor = () => <Icon><path d="M10 13.5V5a2 2 0 014 0v8.5a4 4 0 11-4 0z" /><path d="M12 9v6" /></Icon>
export const IconMix = () => (
  <Icon>
    <circle cx="9" cy="9" r="5" />
    <circle cx="15" cy="9" r="5" />
    <circle cx="12" cy="15" r="5" />
  </Icon>
)
export const IconEffects = () => <Icon><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="7" y="7" width="10" height="10" rx="5" /></Icon>
export const IconDetail = () => <Icon><path d="M12 3l8 17H4z" /></Icon>

export const IconLayout = () => <Icon><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 3v18M12 12h9" /></Icon>
export const IconFill = () => (
  <Icon>
    <path d="M5 11l7-7 7 7-7 7z" />
    <path d="M20 15s1.5 2 1.5 3a1.5 1.5 0 01-3 0c0-1 1.5-3 1.5-3z" />
  </Icon>
)
export const IconStyle = () => <Icon><path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></Icon>
export const IconMoon = () => <Icon><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" /></Icon>
export const IconText = () => <Icon><path d="M5 6V4h14v2" /><path d="M12 4v16" /><path d="M9 20h6" /></Icon>
export const IconAddPhotos = () => (
  <Icon>
    <rect x="3" y="7" width="14" height="14" rx="2" />
    <path d="M7 3h12a2 2 0 012 2v12" />
    <path d="M10 11v6M7 14h6" />
  </Icon>
)
