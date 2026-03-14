'use client'

/**
 * Floating tour panel that guides users through a specific workflow.
 * Renders fixed at the bottom-right corner so users can still navigate
 * the app while following the tour steps.
 */

import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useOnboardingTour } from './OnboardingTourProvider'
import { TOURS } from './tour-definitions'

export function TourModal() {
  const { activeTour, activeTourStep, nextStep, prevStep, closeTour, completeTour } =
    useOnboardingTour()

  if (!activeTour) return null

  const tour = TOURS[activeTour]
  const step = tour.steps[activeTourStep]
  const isFirst = activeTourStep === 0
  const isLast = activeTourStep === tour.steps.length - 1

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 px-5 py-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-blue-200 text-xs font-medium mb-0.5">
            {tour.icon} {tour.title} · Step {activeTourStep + 1} of {tour.steps.length}
          </p>
          <h3 className="text-white font-semibold text-sm leading-snug">{step.title}</h3>
        </div>
        <button
          onClick={closeTour}
          className="text-blue-200 hover:text-white flex-shrink-0 mt-0.5"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-5 pt-3">
        {tour.steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full flex-1 transition-colors duration-300 ${
              i <= activeTourStep ? 'bg-blue-500' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="px-5 pt-3 pb-4">
        <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
        {step.actionHref && (
          <Link
            href={step.actionHref}
            className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {step.actionLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Footer navigation */}
      <div className="px-5 pb-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <button
          onClick={prevStep}
          disabled={isFirst}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {isLast ? (
          <button
            onClick={() => completeTour(activeTour)}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Done
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
