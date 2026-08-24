import { useGameStore } from '../state/store'

/**
 * Lightweight synthesized SFX via the raw Web Audio API — no external sound
 * files yet. This keeps the M1 slice self-contained; swapping in real CC0
 * samples (Kenney.nl / freesound.org) later via howler.js is a drop-in
 * replacement behind these same play*() functions, nothing else changes.
 */
let audioCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
  return audioCtx
}

function playTone(frequencies: number[], durationEach: number, type: OscillatorType = 'sine', gain = 0.08) {
  if (useGameStore.getState().muted) return
  const ctx = getContext()
  if (!ctx) return

  let startTime = ctx.currentTime
  for (const freq of frequencies) {
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + durationEach)
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.start(startTime)
    osc.stop(startTime + durationEach)
    startTime += durationEach * 0.7
  }
}

export function playPurchaseSound() {
  playTone([440, 660, 880], 0.12, 'triangle', 0.07)
}

export function playCashTickSound() {
  playTone([880], 0.06, 'sine', 0.03)
}

export function playPopInSound() {
  playTone([300, 500], 0.08, 'square', 0.05)
}
