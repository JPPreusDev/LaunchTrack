/**
 * GET  /api/projects/[projectId]/messages — list messages
 * POST /api/projects/[projectId]/messages — send message
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendSlackMessage } from '@/services/integrations/slack'

interface Params { params: Promise<{ projectId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('project_messages')
    .select('id, content, is_internal, created_at, user_id, sender:users(full_name, email, role)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(200)

  return NextResponse.json({ data: data ?? [], error: null })
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })

  const { content, is_internal = false } = await request.json()
  if (!content?.trim()) return NextResponse.json({ data: null, error: 'Content required' }, { status: 400 })

  // Clients cannot send internal messages
  const isInternal = profile.role === 'client_user' ? false : is_internal

  // Verify project access
  let hasAccess = false
  if (profile.role !== 'client_user') {
    const { data: project } = await supabase
      .from('onboarding_projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', profile.organization_id)
      .single()
    hasAccess = !!project
  } else {
    const { data: access } = await supabase
      .from('client_portal_access')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    hasAccess = !!access
  }

  if (!hasAccess) return NextResponse.json({ data: null, error: 'No access' }, { status: 403 })

  // Use service client to get organization_id for the project
  const service = createServiceClient()
  const { data: project } = await service
    .from('onboarding_projects')
    .select('organization_id')
    .eq('id', projectId)
    .single()

  if (!project) return NextResponse.json({ data: null, error: 'Project not found' }, { status: 404 })

  const { data, error } = await service
    .from('project_messages')
    .insert({
      project_id: projectId,
      organization_id: project.organization_id,
      user_id: user.id,
      content: content.trim(),
      is_internal: isInternal,
    })
    .select('id, content, is_internal, created_at, user_id, sender:users(full_name, email, role)')
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

  // Notify agency staff via Slack when a client sends a message
  if (profile.role === 'client_user') {
    try {
      const { data: projectDetails } = await service
        .from('onboarding_projects')
        .select('name, client:clients(name)')
        .eq('id', projectId)
        .single()

      const clientName = (projectDetails?.client as { name?: string } | null)?.name ?? 'Client'
      const projectName = projectDetails?.name ?? 'Unknown project'
      const excerpt = content.trim().length > 80
        ? content.trim().slice(0, 80) + '…'
        : content.trim()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

      await sendSlackMessage(project.organization_id, {
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '💬 New Client Message — LaunchTrack' },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*From:*\n${clientName}` },
              { type: 'mrkdwn', text: `*Project:*\n${projectName}` },
            ],
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `> ${excerpt}` },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View Project' },
                url: `${appUrl}/projects/${projectId}`,
              },
            ],
          },
        ],
        text: `New message from ${clientName} in ${projectName}: ${excerpt}`,
      })
    } catch {
      // Non-fatal — message was saved, Slack notification is best-effort
    }
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
