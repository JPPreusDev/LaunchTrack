/**
 * Slack Integration Service.
 * OAuth + notification delivery.
 */
import { createServiceClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto/tokens'

/**
 * Get OAuth authorization URL for Slack.
 */
export function getSlackAuthUrl(organizationId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: 'chat:write,channels:read,incoming-webhook',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
    state: organizationId,
  })
  return `https://slack.com/oauth/v2/authorize?${params}`
}

/**
 * Exchange OAuth code for access token.
 */
export async function exchangeSlackCode(
  code: string,
  organizationId: string
): Promise<void> {
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
    }),
  })

  const data: {
    ok: boolean
    access_token: string
    incoming_webhook?: { channel: string; url: string }
    team?: { name: string }
  } = await response.json()

  if (!data.ok) {
    throw new Error('Slack OAuth failed')
  }

  const encryptedToken = await encrypt(data.access_token)

  const supabase = createServiceClient()
  await supabase
    .from('integrations')
    .upsert({
      organization_id: organizationId,
      provider: 'slack',
      access_token_encrypted: encryptedToken,
      metadata: {
        webhook_url: data.incoming_webhook?.url,
        channel: data.incoming_webhook?.channel,
        team_name: data.team?.name,
      },
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .match({ organization_id: organizationId, provider: 'slack' })
}

async function getSlackWebhookUrl(organizationId: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('integrations')
    .select('metadata')
    .eq('organization_id', organizationId)
    .eq('provider', 'slack')
    .eq('is_active', true)
    .single()

  return (data?.metadata as { webhook_url?: string })?.webhook_url ?? null
}

/**
 * Send a message to the configured Slack channel.
 */
export async function sendSlackMessage(
  organizationId: string,
  message: {
    text: string
    blocks?: unknown[]
  }
): Promise<void> {
  const webhookUrl = await getSlackWebhookUrl(organizationId)
  if (!webhookUrl) {
    console.warn('[Slack] No webhook URL configured for org:', organizationId)
    return
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })

  if (!response.ok) {
    throw new Error(`Slack message failed: ${response.statusText}`)
  }
}

/**
 * Send task overdue alert to Slack.
 */
export async function sendSlackTaskOverdue({
  organizationId,
  taskTitle,
  projectName,
  daysOverdue,
  taskUrl,
}: {
  organizationId: string
  taskTitle: string
  projectName: string
  daysOverdue: number
  taskUrl: string
}): Promise<void> {
  await sendSlackMessage(organizationId, {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '⚠️ Task Overdue — Rampify' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Task:*\n${taskTitle}` },
          { type: 'mrkdwn', text: `*Project:*\n${projectName}` },
          { type: 'mrkdwn', text: `*Overdue by:*\n${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Task' },
            url: taskUrl,
          },
        ],
      },
    ],
    text: `Task overdue: ${taskTitle} in ${projectName} (${daysOverdue} days)`,
  })
}

/**
 * Send project stuck alert to Slack.
 */
export async function sendSlackProjectStuck({
  organizationId,
  projectName,
  clientName,
  daysStuck,
  projectUrl,
}: {
  organizationId: string
  projectName: string
  clientName: string
  daysStuck: number
  projectUrl: string
}): Promise<void> {
  await sendSlackMessage(organizationId, {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔴 Project Stuck — Rampify' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Project:*\n${projectName}` },
          { type: 'mrkdwn', text: `*Client:*\n${clientName}` },
          { type: 'mrkdwn', text: `*Waiting on client for:*\n${daysStuck} days` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Project' },
            url: projectUrl,
          },
        ],
      },
    ],
    text: `Project stuck: ${projectName} (waiting ${daysStuck} days)`,
  })
}

/**
 * Send asset submitted notification to Slack.
 */
export async function sendSlackAssetSubmitted({
  organizationId,
  assetTitle,
  projectName,
  clientName,
  projectUrl,
}: {
  organizationId: string
  assetTitle: string
  projectName: string
  clientName: string
  projectUrl: string
}): Promise<void> {
  await sendSlackMessage(organizationId, {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '✅ Asset Submitted — Rampify' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Asset:*\n${assetTitle}` },
          { type: 'mrkdwn', text: `*Project:*\n${projectName}` },
          { type: 'mrkdwn', text: `*Client:*\n${clientName}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Review Asset' },
            url: projectUrl,
          },
        ],
      },
    ],
    text: `Asset submitted by ${clientName}: ${assetTitle}`,
  })
}

/**
 * Validate Slack request signature.
 */
export function validateSlackSignature(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET!
  const baseString = `v0:${timestamp}:${body}`

  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', signingSecret)
  hmac.update(baseString)
  const computedSig = `v0=${hmac.digest('hex')}`

  return crypto.timingSafeEqual(
    Buffer.from(computedSig),
    Buffer.from(signature)
  )
}
