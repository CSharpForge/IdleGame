export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return [r, g, b]
}

function toHexByte(n: number): string {
  return Math.round(clamp01(n / 255) * 255)
    .toString(16)
    .padStart(2, '0')
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`
}

/** Linearly blends two hex colors; t=0 returns `a`, t=1 returns `b`. */
export function lerpColor(a: string, b: string, t: number): string {
  const clampedT = clamp01(t)
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex([ar + (br - ar) * clampedT, ag + (bg - ag) * clampedT, ab + (bb - ab) * clampedT])
}
