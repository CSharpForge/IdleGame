export interface AchievementSnapshot {
  totalRoomsBuilt: number
  totalFloors: number
  totalEarned: number
  staffCount: number
}

export interface AchievementDef {
  id: string
  label: string
  description: string
  isUnlocked: (snapshot: AchievementSnapshot) => boolean
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-room',
    label: 'Grand Opening',
    description: 'Build your first room.',
    isUnlocked: (s) => s.totalRoomsBuilt >= 1,
  },
  {
    id: 'five-rooms',
    label: 'Growing Fast',
    description: 'Build 5 rooms.',
    isUnlocked: (s) => s.totalRoomsBuilt >= 5,
  },
  {
    id: 'ten-rooms',
    label: 'Bustling Hotel',
    description: 'Build 10 rooms.',
    isUnlocked: (s) => s.totalRoomsBuilt >= 10,
  },
  {
    id: 'second-floor',
    label: 'Going Up',
    description: 'Unlock a second floor.',
    isUnlocked: (s) => s.totalFloors >= 2,
  },
  {
    id: 'first-staff',
    label: "You're Hired",
    description: 'Hire your first staff member.',
    isUnlocked: (s) => s.staffCount >= 1,
  },
  {
    id: 'earn-1000',
    label: 'First Thousand',
    description: 'Earn a total of $1,000.',
    isUnlocked: (s) => s.totalEarned >= 1000,
  },
  {
    id: 'earn-10000',
    label: 'Big Business',
    description: 'Earn a total of $10,000.',
    isUnlocked: (s) => s.totalEarned >= 10000,
  },
]

/** Achievements that just became true given the snapshot, excluding any id already recorded as unlocked. */
export function getNewlyUnlockedAchievements(
  snapshot: AchievementSnapshot,
  alreadyUnlockedIds: string[],
): AchievementDef[] {
  const unlockedSet = new Set(alreadyUnlockedIds)
  return ACHIEVEMENTS.filter((a) => !unlockedSet.has(a.id) && a.isUnlocked(snapshot))
}
