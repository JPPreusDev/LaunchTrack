'use client'

/**
 * Context provider that manages all onboarding tour state.
 * State is persisted to localStorage keyed by userId.
 * Auto-completes tours when the underlying resource already exists
 * (detected via props passed from the server layout on each navigation).
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { TourId } from './tour-definitions'

// ─── State shape ─────────────────────────────────────────────────────────────

export interface OnboardingState {
  dismissed: boolean
  completedTours: TourId[]
}

// ─── Context ─────────────────────────────────────────────────────────────────

export interface TourContextValue {
  state: OnboardingState
  activeTour: TourId | null
  activeTourStep: number
  startTour: (id: TourId) => void
  nextStep: () => void
  prevStep: () => void
  closeTour: () => void
  completeTour: (id: TourId) => void
  resetAllTours: () => void
  dismiss: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function useOnboardingTour(): TourContextValue {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useOnboardingTour must be used inside OnboardingTourProvider')
  return ctx
}

// ─── localStorage helpers ────────────────────────────────────────────────────

function storageKey(userId: string): string {
  return `lt_onboarding_${userId}`
}

function loadState(userId: string): OnboardingState {
  if (typeof window === 'undefined') return { dismissed: false, completedTours: [] }
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (raw) return JSON.parse(raw) as OnboardingState
  } catch {
    // ignore parse errors
  }
  return { dismissed: false, completedTours: [] }
}

function persistState(userId: string, state: OnboardingState): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state))
  } catch {
    // ignore write errors
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface ProviderProps {
  children: React.ReactNode
  userId: string
  /** True when the org already has at least one template (auto-completes that tour). */
  hasTemplates: boolean
  /** True when the org already has at least one client. */
  hasClients: boolean
  /** True when the org already has at least one project. */
  hasProjects: boolean
}

export function OnboardingTourProvider({
  children,
  userId,
  hasTemplates,
  hasClients,
  hasProjects,
}: ProviderProps) {
  // Start with empty state to avoid hydration mismatch; hydrate in useEffect.
  const [state, setState] = useState<OnboardingState>({ dismissed: false, completedTours: [] })
  const [activeTour, setActiveTour] = useState<TourId | null>(null)
  const [activeTourStep, setActiveTourStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Hydrate from localStorage after first client render
  useEffect(() => {
    setState(loadState(userId))
    setMounted(true)
  }, [userId])

  // Auto-complete tours when the corresponding resource already exists.
  // Runs whenever the server re-fetches counts (i.e., on every navigation).
  useEffect(() => {
    if (!mounted) return
    setState((prev) => {
      const completed = new Set(prev.completedTours)
      let changed = false
      if (hasTemplates && !completed.has('template')) { completed.add('template'); changed = true }
      if (hasClients && !completed.has('client')) { completed.add('client'); changed = true }
      if (hasProjects && !completed.has('project')) { completed.add('project'); changed = true }
      if (!changed) return prev
      const next: OnboardingState = { ...prev, completedTours: Array.from(completed) }
      persistState(userId, next)
      return next
    })
  }, [hasTemplates, hasClients, hasProjects, userId, mounted])

  const update = useCallback(
    (updater: (prev: OnboardingState) => OnboardingState) => {
      setState((prev) => {
        const next = updater(prev)
        persistState(userId, next)
        return next
      })
    },
    [userId],
  )

  const startTour = useCallback((id: TourId) => {
    setActiveTour(id)
    setActiveTourStep(0)
  }, [])

  const nextStep = useCallback(() => setActiveTourStep((s) => s + 1), [])
  const prevStep = useCallback(() => setActiveTourStep((s) => Math.max(0, s - 1)), [])

  const closeTour = useCallback(() => {
    setActiveTour(null)
    setActiveTourStep(0)
  }, [])

  const completeTour = useCallback(
    (id: TourId) => {
      update((prev) => ({
        ...prev,
        completedTours: prev.completedTours.includes(id)
          ? prev.completedTours
          : [...prev.completedTours, id],
      }))
      setActiveTour(null)
      setActiveTourStep(0)
    },
    [update],
  )

  const resetAllTours = useCallback(() => {
    update(() => ({ dismissed: false, completedTours: [] }))
  }, [update])

  const dismiss = useCallback(() => {
    update((prev) => ({ ...prev, dismissed: true }))
  }, [update])

  const value: TourContextValue = {
    state,
    activeTour,
    activeTourStep,
    startTour,
    nextStep,
    prevStep,
    closeTour,
    completeTour,
    resetAllTours,
    dismiss,
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}
