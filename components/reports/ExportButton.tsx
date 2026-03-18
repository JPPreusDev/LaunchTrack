'use client'

/**
 * Client-side CSV export button for the reports page.
 */
import { Download } from 'lucide-react'
import { getStatusLabel } from '@/lib/utils'

interface ProjectRow {
  id: string
  name: string
  status: string
  start_date: string | null
  estimated_launch_date: string | null
  client: { name: string; company_name?: string | null } | null
  total: number
  completed: number
  overdue: number
  pct: number
  avgCsat: string | null
  csatCount: number
}

interface ExportButtonProps {
  projects: ProjectRow[]
}

export function ExportButton({ projects }: ExportButtonProps) {
  function exportCsv() {
    const headers = [
      'Project', 'Client', 'Company', 'Status',
      'Start Date', 'Launch Date',
      'Total Tasks', 'Completed', 'Overdue', '% Complete',
      'CSAT Avg', 'CSAT Responses',
    ]

    const rows = projects.map((p) => [
      p.name,
      (p.client as { name: string } | null)?.name ?? '',
      (p.client as { company_name?: string | null } | null)?.company_name ?? '',
      getStatusLabel(p.status as Parameters<typeof getStatusLabel>[0]),
      p.start_date ?? '',
      p.estimated_launch_date ?? '',
      p.total,
      p.completed,
      p.overdue,
      `${p.pct}%`,
      p.avgCsat ?? '',
      p.csatCount,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rampify-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={exportCsv}
      className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  )
}
