import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, differenceInDays, parseISO, format } from 'date-fns'
import { type ProjectStatus, type TaskStatus, STATUS_LABELS, STATUS_COLORS } from '@/types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function getDaysSince(date: string | Date): number {
  const d = typeof date === 'string' ? parseISO(date) : date
  return differenceInDays(new Date(), d)
}

export function getDaysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? parseISO(date) : date
  return differenceInDays(d, new Date())
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return differenceInDays(new Date(), parseISO(dueDate)) > 0
}

export function getStatusLabel(status: ProjectStatus | TaskStatus): string {
  return STATUS_LABELS[status] ?? status
}

export function getStatusColor(status: ProjectStatus | TaskStatus): string {
  return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function calculateLaunchDate(
  startDate: string,
  maxDueDays: number
): Date {
  const start = parseISO(startDate)
  start.setDate(start.getDate() + maxDueDays)
  return start
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function buildPortalUrl(projectId: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/portal/${projectId}`
}
