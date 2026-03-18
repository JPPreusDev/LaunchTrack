/**
 * ClickUp Integration Service.
 * OAuth flow + task sync.
 */
import { createServiceClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto/tokens'
import type { Task, TaskStatus } from '@/types'

const CLICKUP_BASE_URL = 'https://api.clickup.com/api/v2'

const CLICKUP_STATUS_MAP: Record<TaskStatus, string> = {
  not_started: 'to do',
  in_progress: 'in progress',
  waiting_on_client: 'waiting',
  completed: 'complete',
}

const CLICKUP_STATUS_REVERSE: Record<string, TaskStatus> = {
  'to do': 'not_started',
  'in progress': 'in_progress',
  waiting: 'waiting_on_client',
  complete: 'completed',
  closed: 'completed',
}

/**
 * Get OAuth authorization URL for ClickUp.
 */
export function getClickUpAuthUrl(organizationId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.CLICKUP_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/clickup/callback`,
    state: organizationId,
  })
  return `https://app.clickup.com/api?${params}`
}

/**
 * Exchange OAuth code for access token.
 */
export async function exchangeClickUpCode(
  code: string,
  organizationId: string
): Promise<void> {
  const response = await fetch('https://api.clickup.com/api/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.CLICKUP_CLIENT_ID,
      client_secret: process.env.CLICKUP_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/clickup/callback`,
    }),
  })

  if (!response.ok) {
    throw new Error(`ClickUp OAuth failed: ${response.statusText}`)
  }

  const data: { access_token: string } = await response.json()
  const encryptedToken = await encrypt(data.access_token)

  const supabase = createServiceClient()
  await supabase
    .from('integrations')
    .upsert({
      organization_id: organizationId,
      provider: 'clickup',
      access_token_encrypted: encryptedToken,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .match({ organization_id: organizationId, provider: 'clickup' })
}

async function getAccessToken(organizationId: string): Promise<string> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('integrations')
    .select('access_token_encrypted')
    .eq('organization_id', organizationId)
    .eq('provider', 'clickup')
    .single()

  if (!data?.access_token_encrypted) {
    throw new Error('ClickUp not connected')
  }

  return decrypt(data.access_token_encrypted.toString())
}

async function clickupRequest<T>(
  organizationId: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken(organizationId)
  const response = await fetch(`${CLICKUP_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`ClickUp API error ${response.status}: ${text}`)
  }

  return response.json() as Promise<T>
}

/**
 * Get all workspaces (teams) for the connected ClickUp account.
 */
export async function getClickUpWorkspaces(
  organizationId: string
): Promise<{ id: string; name: string }[]> {
  const data = await clickupRequest<{ teams: { id: string; name: string }[] }>(
    organizationId,
    '/team'
  )
  return data.teams
}

/**
 * Get spaces within a workspace.
 */
export async function getClickUpSpaces(
  organizationId: string,
  teamId: string
): Promise<{ id: string; name: string }[]> {
  const data = await clickupRequest<{ spaces: { id: string; name: string }[] }>(
    organizationId,
    `/team/${teamId}/space`
  )
  return data.spaces
}

/**
 * Create a ClickUp list (project mirror) in a space.
 */
export async function createClickUpList(
  organizationId: string,
  spaceId: string,
  projectName: string
): Promise<{ id: string; name: string }> {
  const data = await clickupRequest<{ id: string; name: string }>(
    organizationId,
    `/space/${spaceId}/list`,
    {
      method: 'POST',
      body: JSON.stringify({ name: projectName }),
    }
  )
  return data
}

/**
 * Create a task in ClickUp.
 */
export async function createClickUpTask(
  organizationId: string,
  listId: string,
  task: Pick<Task, 'title' | 'description' | 'due_date' | 'status'>
): Promise<{ id: string }> {
  const data = await clickupRequest<{ id: string }>(
    organizationId,
    `/list/${listId}/task`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: task.title,
        description: task.description ?? '',
        status: CLICKUP_STATUS_MAP[task.status],
        due_date: task.due_date
          ? new Date(task.due_date).getTime()
          : undefined,
      }),
    }
  )
  return data
}

/**
 * Update a ClickUp task status.
 */
export async function updateClickUpTaskStatus(
  organizationId: string,
  externalTaskId: string,
  status: TaskStatus
): Promise<void> {
  await clickupRequest(organizationId, `/task/${externalTaskId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: CLICKUP_STATUS_MAP[status] }),
  })
}

/**
 * Sync all tasks from a OnRampd project to ClickUp.
 */
export async function syncProjectToClickUp(
  organizationId: string,
  onrampdProjectId: string,
  clickupListId: string
): Promise<void> {
  const supabase = createServiceClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', onrampdProjectId)

  if (!tasks) return

  for (const task of tasks) {
    // Check if mapping already exists
    const { data: existing } = await supabase
      .from('integration_mappings')
      .select('external_project_id')
      .eq('organization_id', organizationId)
      .eq('provider', 'clickup')
      .eq('onrampd_project_id', onrampdProjectId)
      .eq('mapping_type', 'task')
      .eq('metadata->>onrampd_task_id', task.id)
      .maybeSingle()

    if (!existing) {
      const clickupTask = await createClickUpTask(organizationId, clickupListId, task)

      await supabase.from('integration_mappings').insert({
        organization_id: organizationId,
        provider: 'clickup',
        onrampd_project_id: onrampdProjectId,
        external_project_id: clickupTask.id,
        mapping_type: 'task',
        metadata: { onrampd_task_id: task.id, list_id: clickupListId },
      })
    }
  }

  // Update last synced
  await supabase
    .from('integration_mappings')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('provider', 'clickup')
    .eq('onrampd_project_id', onrampdProjectId)
    .eq('mapping_type', 'project')
}

/**
 * Handle incoming ClickUp webhook event.
 */
export async function handleClickUpWebhook(
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient()

  const event = payload['event'] as string
  if (!event?.includes('task')) return

  const taskData = payload['task_id'] as string
  if (!taskData) return

  // Find mapping
  const { data: mapping } = await supabase
    .from('integration_mappings')
    .select('*, onrampd_project_id')
    .eq('provider', 'clickup')
    .eq('external_project_id', taskData)
    .eq('mapping_type', 'task')
    .maybeSingle()

  if (!mapping) return

  const taskId = (mapping.metadata as Record<string, string>)['onrampd_task_id']
  const newStatus = (payload['task'] as Record<string, unknown>)?.['status'] as {
    status: string
  }

  if (!taskId || !newStatus?.status) return

  const onrampdStatus = CLICKUP_STATUS_REVERSE[newStatus.status.toLowerCase()]
  if (!onrampdStatus) return

  await supabase
    .from('tasks')
    .update({ status: onrampdStatus, updated_at: new Date().toISOString() })
    .eq('id', taskId)

  console.log(`[ClickUp] Synced task ${taskId} status → ${onrampdStatus}`)
}
