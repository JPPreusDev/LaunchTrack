import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface ApprovalBannerProps {
  count: number
  projectId: string
}

export function ApprovalBanner({ count, projectId }: ApprovalBannerProps) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-purple-900">
          {count} approval{count !== 1 ? 's' : ''} pending
        </p>
        <p className="text-xs text-purple-600 mt-0.5">
          Project cannot proceed until these are resolved.
        </p>
      </div>
      <Link
        href={`/projects/${projectId}/approvals`}
        className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-purple-700 transition-colors"
      >
        Review
      </Link>
    </div>
  )
}
