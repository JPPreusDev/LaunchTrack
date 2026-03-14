/**
 * Teamwork Integration Service.
 * OAuth + project/task sync.
 */
import { createServiceClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto/tokens'
import type { TaskStatus } from '@/types'

const TEAMWORK_STATUS_MAP: Record<TaskStatus, string> = {
  not_started: 'new',
  in_progress: 'inprogress',
  waiting_on_client: 'waiting',
  completed: 'completed',
}

/**
 * Get OAuth authorization URL for Teamwork.
 */
export function getTeamworkAuthUrl(organizationId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.TEAMWORK_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/teamwork/callback`,
    response_type: 'code',
    state: organizationId,
  })
  return `https://www.teamwork.com/launchpad/login?${params}`
}

/**
 * Exchange OAuth code for access token.
 */
export async function exchangeTeamworkCode(
  code: string,
  organizationId: string
): Promise<void> {
  const response = await fetch('https://www.teamwork.com/launchpad/v1/token.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.TEAMWORK_CLIENT_ID,
      client_secret: process.env.TEAMWORK_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/teamwork/callback`,
      code,
    }),
  })

  const data: {
    access_token: string
    installation?: { apiEndPoint: string }
  } = await response.json()

  if (!data.access_token) throw new Error('Teamwork OAuth failed')

  const encryptedToken = await encrypt(data.access_token)

  const supabase = createServiceClient()
  await supabase
    .from('integrations')
    .upsert({
      organization_id: organizationId,
      provider: 'teamwork',
      access_token_encrypted: encryptedToken,
      metadata: {
        api_endpoint: data.installation?.apiEndPoint,
      },
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .match({ organization_id: organizationId, provider: 'teamwork' })
}

async function getCredentials(organizationId: string): Promise<{
  token: string
  apiEndpoint: string
}> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('integrations')
    .select('access_token_encrypted, metadata')
    .eq('organization_id', organizationId)
    .eq('provider', 'teamwork')
    .single()

  if (!data?.access_token_encrypted) throw new Error('Teamwork not connected')

  return {
    token: await decrypt(data.access_token_encrypted.toString()),
    apiEndpoint:
      (data.metadata as { api_endpoint?: string })?.api_endpoint ??
      'https://yoursite.teamwork.com',
  }
}

async function teamworkRequest<T>(
  organizationId: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { token, apiEndpoint } = await getCredentials(organizationId)

  const response = await fetch(`${apiEndpoint}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Teamwork API error ${response.status}`)
  }

  return response.json() as Promise<T>
}

/**
 * Get all Teamwork projects.
 */
export async function getTeamworkProjects(
  organizationId: string
): Promise<{ id: string; name: string }[]> {
  const data = await teamworkRequest<{ projects: { id: string; name: string }[] }>(
    organizationId,
    '/projects.json'
  )
  return data.projects
}

/**
 * Create a task in Teamwork.
 */
export async function createTeamworkTask(
  organizationId: string,
  taskListId: string,
  task: {
    title: string
    description?: string | null
    status: TaskStatus
    dueDate?: string | null
  }
): Promise<{ id: string }> {
  const data = await teamworkRequest<{ id: string }>(
    organizationId,
    `/tasklists/${taskListId}/tasks.json`,
    {
      method: 'POST',
      body: JSON.stringify({
        'todo-item': {
          content: task.title,
          description: task.description ?? '',
          status: TEAMWORK_STATUS_MAP[task.status],
          'due-date': task.dueDate
            ? task.dueDate.replace(/-/g, '')
            : undefined,
        },
      }),
    }
  )
  return data
}

/**
 * Update a Teamwork task status.
 */
export async function updateTeamworkTaskStatus(
  organizationId: string,
  taskId: string,
  status: TaskStatus
): Promise<void> {
  await teamworkRequest(organizationId, `/tasks/${taskId}.json`, {
    method: 'PUT',
    body: JSON.stringify({
      'todo-item': { status: TEAMWORK_STATUS_MAP[status] },
    }),
  })
}

/**
 * Create a task list within a Teamwork project.
 */
export async function createTeamworkTaskList(
  organizationId: string,
  projectId: string,
  name: string
): Promise<{ id: string }> {
  const data = await teamworkRequest<{ id: string }>(
    organizationId,
    `/projects/${projectId}/tasklists.json`,
    {
      method: 'POST',
      body: JSON.stringify({ tasklist: { name } }),
    }
  )
  return data
}
