'use client'

/**
 * Dashboard widget that shows the three onboarding tours as a checklist.
 * Visible to org_admin users until all tours are completed or dismissed.
 * Clicking any item opens the corresponding tour modal.
 */

import { CheckCircle2, Circle, X, ChevronRight } from 'lucide-react'
import { useOnboardingTour } from './OnboardingTourProvider'
import { TOURS, TOUR_ORDER } from './tour-definitions'

export function OnboardingChecklist() {
  const { state, startTour, dismiss } = useOnboardingTour()

  const allComplete = TOUR_ORDER.every((id) => state.completedTours.includes(id))

  // Hide when dismissed or every tour is done
  if (state.dismissed || allComplete) return null

  const completedCount = state.completedTours.length

  return (
    <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg" role="img" aria-label="rocket">🚀</span>
            <h2 className="font-semibold text-slate-900">Get Started with LaunchTrack</h2>
          </div>
          <p className="text-sm text-slate-500">
            {completedCount} of {TOUR_ORDER.length} steps completed
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Dismiss getting started guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-1 bg-blue-500 transition-all duration-500"
          style={{ width: `${(completedCount / TOUR_ORDER.length) * 100}%` }}
        />
      </div>

      {/* Tour items */}
      <div className="divide-y divide-slate-50">
        {TOUR_ORDER.map((tourId) => {
          const tour = TOURS[tourId]
          const isComplete = state.completedTours.includes(tourId)

          return (
            <button
              key={tourId}
              onClick={() => startTour(tourId)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left group"
            >
              <div className={`flex-shrink-0 transition-colors ${isComplete ? 'text-green-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
                {isComplete
                  ? <CheckCircle2 className="w-5 h-5" />
                  : <Circle className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm" role="img" aria-label={tour.title}>{tour.icon}</span>
                  <p className={`font-medium text-sm ${isComplete ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {tour.title}
                  </p>
                  {isComplete && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                      Done
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{tour.subtitle}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {isComplete ? 'Replay' : 'Start tour'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
