import { cn, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      getStatusColor(status)
    )}>
      {getStatusLabel(status)}
    </span>
  )
}
