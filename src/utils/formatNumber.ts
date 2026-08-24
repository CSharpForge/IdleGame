const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi']

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs < 1000) {
    return sign + (Number.isInteger(abs) ? abs.toString() : abs.toFixed(1))
  }
  const tier = Math.min(Math.floor(Math.log10(abs) / 3), SUFFIXES.length - 1)
  const scaled = abs / Math.pow(1000, tier)
  return `${sign}${scaled.toFixed(scaled < 10 ? 2 : 1)}${SUFFIXES[tier]}`
}
