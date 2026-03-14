/**
 * LaunchTrack Automation Engine.
 * Evaluates rules and triggers actions for overdue tasks,
 * pending assets, and stuck projects.
 */
import { createServiceClient } from '@/lib/supabase/server'
import {
  sendTaskOverdueEmail,
  sendAssetReminderEmail,
  createNotification,
} from '@/services/notifications'
import { buildPortalUrl } from '@/lib/utils'
import { differenceInDays, parseISO } from 'date-fns'

/**
 * Run all active automation rules for all organizations.
 * Called by a cron job (e.g., Vercel Cron or external scheduler).
 */
export async function runAutomationEngine(): Promise<void> {
  const supabase = createServiceClient()
  console.log('[Automation] Starting engine run...')

  const { data: rules, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('is_active', true)

  if (error || !rules) {
    console.error('[Automation] Failed to fetch rules:', error?.message)
    return
  }

  for (const rule of rules) {
    try {
      await processRule(rule)
    } catch (err) {
      console.error(`[Automation] Rule ${rule.id} failed:`, err)
    }
  }

  console.log('[Automation] Engine run complete.')
}

async function processRule(rule: {
  id: string
  organization_id: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  action_type: string
  action_config: Record<string, unknown>
}): Promise<void> {
  switch (rule.trigger_type) {
    case 'task_overdue':
      await handleTaskOverdue(rule)
      break
    case 'asset_pending':
      await handleAssetPending(rule)
      break
    case 'project_stuck':
      await handleProjectStuck(rule)
      break
  }
}

async function handleTaskOverdue(rule: {
  organization_id: string
  trigger_config: Record<string, unknown>
  action_type: string
}): Promise<void> {
  const supabase = createServiceClient()
  const daysOverdue = (rule.trigger_config['days_overdue'] as number) ?? 1

  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:users!tasks_assigned_to_fkey(id, email, full_name),
      project:onboarding_projects(id, name, organization_id,
        organization:organizations(name)
      )
    `)
    .eq('organization_id', rule.organization_id)
    .neq('status', 'completed')
    .not('due_date', 'is', null)
    .lte('due_date', new Date(Date.now() - daysOverdue * 86400000).toISOString().split('T')[0])

  if (!overdueTasks) return

  for (const task of overdueTasks) {
    const days = differenceInDays(new Date(), parseISO(task.due_date))

    if (rule.action_type === 'send_email' && task.assignee?.email) {
      await sendTaskOverdueEmail({
        userEmail: task.assignee.email,
        userName: task.assignee.full_name ?? 'Team Member',
        agencyName: task.project?.organization?.name ?? 'Your Agency',
        taskTitle: task.title,
        projectName: task.project?.name ?? 'Your Project',
        daysOverdue: days,
        taskUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${task.project_id}`,
      })
    }

    if (rule.action_type === 'notify_team' && task.assignee?.id) {
      await createNotification({
        organizationId: rule.organization_id,
        userId: task.assignee.id,
        title: 'Task Overdue',
        message: `"${task.title}" is ${days} day${days !== 1 ? 's' : ''} overdue`,
        type: 'task_overdue',
        referenceId: task.id,
        referenceType: 'task',
      })
    }
  }
}

async function handleAssetPending(rule: {
  organization_id: string
  trigger_config: Record<string, unknown>
  action_type: string
}): Promise<void> {
  const supabase = createServiceClient()
  const daysPending = (rule.trigger_config['days_pending'] as number) ?? 3

  const cutoffDate = new Date(Date.now() - daysPending * 86400000).toISOString()

  const { data: pendingAssets } = await supabase
    .from('asset_requests')
    .select(`
      *,
      project:onboarding_projects(
        id, name,
        organization:organizations(name),
        client:clients(email, name)
      )
    `)
    .eq('organization_id', rule.organization_id)
    .eq('status', 'pending')
    .lte('created_at', cutoffDate)

  if (!pendingAssets) return

  for (const asset of pendingAssets) {
    // Skip if reminder was sent recently (within last 3 days)
    if (
      asset.reminder_sent_at &&
      differenceInDays(new Date(), parseISO(asset.reminder_sent_at)) < 3
    ) {
      continue
    }

    if (asset.project?.client?.email) {
      await sendAssetReminderEmail({
        clientEmail: asset.project.client.email,
        clientName: asset.project.client.name,
        agencyName: asset.project.organization?.name ?? 'Your Agency',
        assetTitle: asset.title,
        projectName: asset.project.name,
        portalUrl: buildPortalUrl(asset.project_id),
      })

      // Update reminder timestamp and count
      await supabase
        .from('asset_requests')
        .update({
          reminder_sent_at: new Date().toISOString(),
          reminder_count: (asset.reminder_count ?? 0) + 1,
        })
        .eq('id', asset.id)
    }
  }
}

async function handleProjectStuck(rule: {
  organization_id: string
  trigger_config: Record<string, unknown>
  action_type: string
}): Promise<void> {
  const supabase = createServiceClient()
  const daysStuck = (rule.trigger_config['days_stuck'] as number) ?? 5

  const cutoffDate = new Date(Date.now() - daysStuck * 86400000).toISOString()

  const { data: stuckProjects } = await supabase
    .from('onboarding_projects')
    .select(`
      *,
      client:clients(name, email),
      organization:organizations(name)
    `)
    .eq('organization_id', rule.organization_id)
    .eq('status', 'waiting_on_client')
    .not('waiting_since', 'is', null)
    .lte('waiting_since', cutoffDate)

  if (!stuckProjects) return

  // Notify org admins about stuck projects
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('organization_id', rule.organization_id)
    .eq('role', 'org_admin')

  if (!admins) return

  for (const project of stuckProjects) {
    const days = differenceInDays(new Date(), parseISO(project.waiting_since!))

    for (const admin of admins) {
      await createNotification({
        organizationId: rule.organization_id,
        userId: admin.id,
        title: 'Project Stuck',
        message: `"${project.name}" has been waiting on client for ${days} days`,
        type: 'project_stuck',
        referenceId: project.id,
        referenceType: 'project',
      })
    }
  }
}
