'use client'

/**
 * Settings page section that lets admins replay any onboarding tour
 * and reset the entire guide back to its initial state.
 */

import { BookOpen, RotateCcw, CheckCircle2, Circle } from 'lucide-react'
import { useOnboardingTour } from './OnboardingTourProvider'
import { TOURS, TOUR_ORDER } from './tour-definitions'

export function GettingStartedSection() {
  const { state, startTour, resetAllTours } = useOnboardingTour()

  const completedCount = state.completedTours.length
  const allComplete = completedCount === TOUR_ORDER.length

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Getting Started Guide</h2>
          {allComplete && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              All complete
            </span>
          )}
        </div>
        <button
          onClick={resetAllTours}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          title="Reset all tours to incomplete"
        >
          <RotateCcw className="w-3 h-3" />
          Reset all
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-1 bg-red-600 transition-all duration-500"
          style={{ width: `${(completedCount / TOUR_ORDER.length) * 100}%` }}
        />
      </div>

      {/* Tour rows */}
      <div className="divide-y divide-slate-50">
        {TOUR_ORDER.map((tourId) => {
          const tour = TOURS[tourId]
          const isComplete = state.completedTours.includes(tourId)

          return (
            <div key={tourId} className="flex items-center gap-4 px-6 py-4">
              {/* Status icon */}
              <div className={`flex-shrink-0 ${isComplete ? 'text-green-500' : 'text-slate-300'}`}>
                {isComplete
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <Circle className="w-4 h-4" />}
              </div>

              {/* Icon + text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm" role="img" aria-label={tour.title}>{tour.icon}</span>
                  <p className="font-medium text-sm text-slate-900">{tour.title}</p>
                </div>
                <p className="text-xs text-slate-500">{tour.subtitle}</p>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isComplete && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Completed
                  </span>
                )}
                <button
                  onClick={() => startTour(tourId)}
                  className="text-sm text-red-700 hover:text-red-800 font-medium transition-colors"
                >
                  {isComplete ? 'Replay' : 'Start'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          {completedCount} of {TOUR_ORDER.length} tours completed
          {state.dismissed && ' · Guide dismissed on dashboard'}
        </p>
      </div>
    </div>
  )
}
