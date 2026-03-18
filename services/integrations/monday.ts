/**
 * Monday.com Integration Service.
 * OAuth + board/item sync.
 */
import { createServiceClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto/tokens'
import type { TaskStatus } from '@/types'

const MONDAY_API_URL = 'https://api.monday.com/v2'

const MONDAY_STATUS_MAP: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'Working on it',
  waiting_on_client: 'Waiting on Client',
  completed: 'Done',
}

/**
 * Get OAuth authorization URL for Monday.com.
 */
export function getMondayAuthUrl(organizationId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MONDAY_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/monday/callback`,
    state: organizationId,
  })
  return `https://auth.monday.com/oauth2/authorize?${params}`
}

/**
 * Exchange OAuth code for access token.
 */
export async function exchangeMondayCode(
  code: string,
  organizationId: string
): Promise<void> {
  const response = await fetch('https://auth.monday.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.MONDAY_CLIENT_ID,
      client_secret: process.env.MONDAY_CLIENT_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/monday/callback`,
      code,
    }),
  })

  const data: { access_token: string } = await response.json()
  if (!data.access_token) throw new Error('Monday.com OAuth failed')

  const encryptedToken = await encrypt(data.access_token)

  const supabase = createServiceClient()
  await supabase
    .from('integrations')
    .upsert({
      organization_id: organizationId,
      provider: 'monday',
      access_token_encrypted: encryptedToken,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .match({ organization_id: organizationId, provider: 'monday' })
}

async function getAccessToken(organizationId: string): Promise<string> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('integrations')
    .select('access_token_encrypted')
    .eq('organization_id', organizationId)
    .eq('provider', 'monday')
    .single()

  if (!data?.access_token_encrypted) throw new Error('Monday.com not connected')
  return decrypt(data.access_token_encrypted.toString())
}

async function mondayQuery<T>(
  organizationId: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = await getAccessToken(organizationId)

  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  const result: { data: T; errors?: { message: string }[] } = await response.json()

  if (result.errors?.length) {
    throw new Error(`Monday.com error: ${result.errors[0].message}`)
  }

  return result.data
}

/**
 * Get all Monday.com boards for the connected workspace.
 */
export async function getMondayBoards(
  organizationId: string
): Promise<{ id: string; name: string }[]> {
  const data = await mondayQuery<{ boards: { id: string; name: string }[] }>(
    organizationId,
    `query { boards(limit: 50) { id name } }`
  )
  return data.boards
}

/**
 * Create a group (phase) within a Monday.com board.
 */
export async function createMondayGroup(
  organizationId: string,
  boardId: string,
  groupName: string
): Promise<string> {
  const data = await mondayQuery<{ create_group: { id: string } }>(
    organizationId,
    `mutation($boardId: ID!, $name: String!) {
       create_group(board_id: $boardId, group_name: $name) { id }
     }`,
    { boardId, name: groupName }
  )
  return data.create_group.id
}

/**
 * Create an item (task) in a Monday.com board group.
 */
export async function createMondayItem(
  organizationId: string,
  boardId: string,
  groupId: string,
  taskTitle: string,
  status: TaskStatus,
  dueDate?: string | null
): Promise<string> {
  const columnValues = JSON.stringify({
    status: { label: MONDAY_STATUS_MAP[status] },
    ...(dueDate ? { date: { date: dueDate } } : {}),
  })

  const data = await mondayQuery<{ create_item: { id: string } }>(
    organizationId,
    `mutation($boardId: ID!, $groupId: String!, $name: String!, $columnValues: JSON) {
       create_item(
         board_id: $boardId,
         group_id: $groupId,
         item_name: $name,
         column_values: $columnValues
       ) { id }
     }`,
    { boardId, groupId, name: taskTitle, columnValues }
  )
  return data.create_item.id
}

/**
 * Update a Monday.com item status.
 */
export async function updateMondayItemStatus(
  organizationId: string,
  boardId: string,
  itemId: string,
  status: TaskStatus
): Promise<void> {
  await mondayQuery(
    organizationId,
    `mutation($boardId: ID!, $itemId: ID!, $value: JSON!) {
       change_column_value(
         board_id: $boardId,
         item_id: $itemId,
         column_id: "status",
         value: $value
       ) { id }
     }`,
    {
      boardId,
      itemId,
      value: JSON.stringify({ label: MONDAY_STATUS_MAP[status] }),
    }
  )
}

/**
 * Sync a Rampify project to a Monday.com board.
 */
export async function syncProjectToMonday(
  organizationId: string,
  rampifyProjectId: string,
  mondayBoardId: string
): Promise<void> {
  const supabase = createServiceClient()

  const { data: phases } = await supabase
    .from('project_phases')
    .select('*, tasks(*)')
    .eq('project_id', rampifyProjectId)
    .order('sort_order')

  if (!phases) return

  for (const phase of phases) {
    const groupId = await createMondayGroup(organizationId, mondayBoardId, phase.name)

    for (const task of (phase as { tasks: { id: string; title: string; status: TaskStatus; due_date: string | null }[] }).tasks ?? []) {
      const itemId = await createMondayItem(
        organizationId,
        mondayBoardId,
        groupId,
        task.title,
        task.status,
        task.due_date
      )

      await supabase.from('integration_mappings').insert({
        organization_id: organizationId,
        provider: 'monday',
        rampify_project_id: rampifyProjectId,
        external_project_id: itemId,
        mapping_type: 'task',
        metadata: {
          rampify_task_id: task.id,
          board_id: mondayBoardId,
          group_id: groupId,
        },
      })
    }
  }
}
