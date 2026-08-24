import { useState } from 'react'
import { useGameStore } from '../../game/state/store'
import { colors, modalBackdropStyle, modalCardShellStyle, radii } from '../theme'

interface TutorialStep {
  icon: string
  title: string
  body: string
}

const STEPS: TutorialStep[] = [
  {
    icon: '🏨',
    title: 'Welcome to Grand Stay Tycoon',
    body: 'Build rooms, welcome guests, and grow your hotel empire from a single starter location.',
  },
  {
    icon: '🛏️',
    title: 'Buy Rooms',
    body: 'Open the panel at the bottom of the screen to buy rooms and floors. Guests check in on their own once a room exists.',
  },
  {
    icon: '💰',
    title: 'Earn & Staff Up',
    body: 'Cash accrues automatically from occupied rooms. Hire staff to boost income and keep guests satisfied.',
  },
  {
    icon: '✨',
    title: 'Prestige for the Long Run',
    body: "Once you've earned enough, prestige for a permanent income boost that carries into every future reset. Good luck!",
  },
]

// Deliberately a low-fidelity sequential card series, not a DOM-measurement
// spotlight/coach-mark system pointing at live UI elements — that's
// substantially more engineering than a portfolio project's first-run
// tutorial needs. Same modal shell pattern as PrestigeConfirmModal.
export function TutorialOverlay() {
  const tutorialCompleted = useGameStore((s) => s.tutorialCompleted)
  const completeTutorial = useGameStore((s) => s.completeTutorial)
  const [stepIndex, setStepIndex] = useState(0)

  if (tutorialCompleted) return null

  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  return (
    <div style={modalBackdropStyle}>
      <div style={modalCardShellStyle({ padding: '28px 24px', textAlign: 'center' })}>
        <div style={{ fontSize: '40px' }}>{step.icon}</div>
        <h2 style={{ margin: '8px 0 4px', fontSize: '20px' }}>{step.title}</h2>
        <p style={{ color: colors.textMuted, margin: '0 0 20px', fontSize: '14px' }}>{step.body}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: i === stepIndex ? colors.primary : '#ddd',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => (isLastStep ? completeTutorial() : setStepIndex((i) => i + 1))}
          style={{
            border: 'none',
            background: colors.primary,
            color: '#fff',
            fontWeight: 700,
            fontSize: '16px',
            padding: '12px 24px',
            borderRadius: radii.md,
            width: '100%',
            marginBottom: '8px',
          }}
        >
          {isLastStep ? "Let's Go" : 'Next'}
        </button>
        <button
          onClick={completeTutorial}
          style={{
            border: 'none',
            background: 'transparent',
            color: colors.textMuted,
            fontSize: '14px',
            padding: '8px',
            width: '100%',
          }}
        >
          Skip
        </button>
      </div>
    </div>
  )
}
