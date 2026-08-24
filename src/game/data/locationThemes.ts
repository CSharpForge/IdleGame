import type { LocationThemeId } from '../../types/entities'

export interface LocationThemeDef {
  id: LocationThemeId
  label: string
  unlockCost: number
  skyColor: string
  groundColor: string
  ambientSkyColor: string
}

export const LOCATION_THEMES: LocationThemeDef[] = [
  {
    id: 'coastal',
    label: 'Beach Resort',
    unlockCost: 0,
    skyColor: '#bcd7ff',
    groundColor: '#e0d3a0',
    ambientSkyColor: '#bcd7ff',
  },
  {
    id: 'mountain',
    label: 'Mountain Lodge',
    unlockCost: 5_000,
    skyColor: '#d8e6f0',
    groundColor: '#6b8f71',
    ambientSkyColor: '#e8f0f5',
  },
  {
    id: 'city',
    label: 'City High-Rise',
    unlockCost: 25_000,
    skyColor: '#8fa3c0',
    groundColor: '#585a5e',
    ambientSkyColor: '#a9b7cc',
  },
  {
    id: 'desert',
    label: 'Desert Oasis',
    unlockCost: 100_000,
    skyColor: '#ffe0b0',
    groundColor: '#dcb26b',
    ambientSkyColor: '#ffedcf',
  },
]

export function getLocationThemeDef(id: LocationThemeId): LocationThemeDef {
  const def = LOCATION_THEMES.find((t) => t.id === id)
  if (!def) throw new Error(`Unknown location theme: ${id}`)
  return def
}

export function isFirstLocationTheme(id: LocationThemeId): boolean {
  return LOCATION_THEMES[0].id === id
}
