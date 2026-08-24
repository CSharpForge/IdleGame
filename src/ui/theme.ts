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
  // `fixed`, not `absolute`: several modals (SettingsModal and anything it
  // opens, like AchievementsDashboardModal) are mounted from inside
  // TopHudRow, which is itself `position: absolute` and only as tall as its
  // own HUD row content — an `absolute` backdrop would resolve `inset: 0`
  // against that small box instead of the viewport, only becoming visibly
  // broken once a modal's content (the achievements dashboard) actually
  // exceeded that HUD row's height. `fixed` always resolves against the
  // viewport regardless of which ancestor happens to be positioned.
  position: 'fixed',
  inset: 0,
  pointerEvents: 'auto',
  background: backdropDim,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
}

/**
 * maxHeight/overflowY guard against a modal's content growing past a short
 * screen's height. `minHeight: 0` is required alongside them: a flex item's
 * default `min-height: auto` makes browsers center it (via
 * modalBackdropStyle's `align-items: center`) using its unclamped content
 * height instead of the clamped maxHeight, pushing tall content mostly
 * above the viewport — a latent bug in this shared shell that only
 * surfaced once a modal's content (the achievements dashboard) actually
 * exceeded 80dvh for the first time.
 */
export function modalCardShellStyle(overrides?: CSSProperties): CSSProperties {
  return {
    background: colors.cardShellBg,
    borderRadius: radii.xl,
    maxWidth: '340px',
    width: '100%',
    maxHeight: '80dvh',
    minHeight: 0,
    overflowY: 'auto',
    touchAction: 'pan-y',
    boxShadow: shadows.modal,
    ...overrides,
  }
}
