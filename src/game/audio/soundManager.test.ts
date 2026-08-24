import { describe, expect, it } from 'vitest'
import { playCashTickSound, playPopInSound, playPurchaseSound } from './soundManager'

describe('soundManager', () => {
  // jsdom has no Web Audio API, which is also true of some real locked-down
  // browser contexts — these calls must degrade silently, never throw.
  it('does not throw when the Web Audio API is unavailable', () => {
    expect(() => playPurchaseSound()).not.toThrow()
    expect(() => playCashTickSound()).not.toThrow()
    expect(() => playPopInSound()).not.toThrow()
  })
})
