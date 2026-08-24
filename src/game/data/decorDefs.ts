import type { LocationThemeId } from '../../types/entities'

export type DecorPropType =
  | 'palmTree'
  | 'pineTree'
  | 'rock'
  | 'cactus'
  | 'lampPost'
  | 'bench'
  | 'igloo'
  | 'obsidianSpike'
  | 'fern'
  | 'umbrella'

export interface DecorPropDef {
  type: DecorPropType
  color: string
  accentColor: string
}

/**
 * Each theme's decor set — cycled through (not randomly picked) by the
 * scene's prop-scattering logic, so the same theme always shows the same
 * mix of prop kinds rather than a different random subset every render.
 */
export const THEME_DECOR: Record<LocationThemeId, DecorPropDef[]> = {
  coastal: [
    { type: 'palmTree', color: '#3f6b3a', accentColor: '#8a5a2b' },
    { type: 'umbrella', color: '#e07a5f', accentColor: '#f8f9fa' },
  ],
  mountain: [
    { type: 'pineTree', color: '#2f4f3a', accentColor: '#5c4a3a' },
    { type: 'rock', color: '#8a8a8a', accentColor: '#8a8a8a' },
  ],
  city: [
    { type: 'lampPost', color: '#333333', accentColor: '#ffe066' },
    { type: 'bench', color: '#5c4a3a', accentColor: '#333333' },
  ],
  desert: [
    { type: 'cactus', color: '#4d7a4d', accentColor: '#3a5c3a' },
    { type: 'rock', color: '#a67c52', accentColor: '#8a6540' },
  ],
  jungle: [
    { type: 'fern', color: '#2f6b2f', accentColor: '#245224' },
    { type: 'palmTree', color: '#245c24', accentColor: '#5c4a3a' },
  ],
  arctic: [
    { type: 'pineTree', color: '#e8f4f8', accentColor: '#3a5a6b' },
    { type: 'igloo', color: '#eaf6ff', accentColor: '#cde8f5' },
  ],
  volcanic: [
    { type: 'obsidianSpike', color: '#2b2321', accentColor: '#e63946' },
    { type: 'rock', color: '#4a3b3a', accentColor: '#e63946' },
  ],
}

export function getThemeDecor(themeId: LocationThemeId): DecorPropDef[] {
  return THEME_DECOR[themeId]
}
