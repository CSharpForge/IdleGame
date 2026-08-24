import type { LocationThemeId } from '../../types/entities'

export type WeatherKind = 'none' | 'rain' | 'snow' | 'sandstorm' | 'ash'

/** Every theme gets an explicit (possibly 'none') weather identity — deliberate, not an oversight. */
export const THEME_WEATHER: Record<LocationThemeId, WeatherKind> = {
  coastal: 'none',
  mountain: 'snow',
  city: 'rain',
  desert: 'sandstorm',
  jungle: 'rain',
  arctic: 'snow',
  volcanic: 'ash',
}

export function getThemeWeather(themeId: LocationThemeId): WeatherKind {
  return THEME_WEATHER[themeId]
}
