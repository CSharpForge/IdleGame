import type { CSSProperties } from 'react'

export const colors = {
  primary: '#3d5a80',
  teal: '#4d908e',
  coral: '#e07a5f',
  purple: '#9b5de5',
  danger: '#c1121f',
  neutralDisabled: '#8a8a8a',
  cardShellBg: '#fff',
  textMuted: '#666',
} as const

export const radii = { sm: '10px', md: '12px', lg: '14px', xl: '18px' } as const

export const shadows = {
  modal: '0 10px 40px rgba(0,0,0,0.3)',
  toast: '0 6px 20px rgba(0,0,0,0.35)',
  banner: '0 4px 16px rgba(0,0,0,0.25)',
} as const

export const backdropDim = 'rgba(0, 0, 0, 0.55)'

// Three canonical HUD-pill backgrounds, not one: the literal variants found
// across the HUD encode a real active/inactive/emphasis distinction
// (PrestigeButton's not-yet-available state, ShopPanel's inactive tab,
// active-tab emphasis) rather than accidental drift, so the inconsistent
// spread collapses onto these tokens instead of erasing the distinction.
export const hudPillBg = 'rgba(0, 0, 0, 0.55)' // standard/active pill
export const hudPillBgDim = 'rgba(0, 0, 0, 0.35)' // inactive/secondary pill
export const hudPillBgActive = 'rgba(0, 0, 0, 0.75)' // pressed/selected emphasis

export const modalBackdropStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'auto',
  background: backdropDim,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
}

/** maxHeight/overflowY guard against a modal's content growing past a short screen's height. */
export function modalCardShellStyle(overrides?: CSSProperties): CSSProperties {
  return {
    background: colors.cardShellBg,
    borderRadius: radii.xl,
    maxWidth: '340px',
    width: '100%',
    maxHeight: '80dvh',
    overflowY: 'auto',
    touchAction: 'pan-y',
    boxShadow: shadows.modal,
    ...overrides,
  }
}
