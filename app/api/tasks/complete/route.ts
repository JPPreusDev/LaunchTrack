/**
 * POST /api/tasks/complete
 * Marks a client task complete/incomplete and notifies assigned team members
 * whose service category matches and have notify_on_client_complete enabled.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail, buildEmailHtml } from '@/lib/resend/client'

export async function POST(request: NextRequest) {
  try {
    const body: { taskId: string; completed: boolean } = await request.json()
    if (!body.taskId) {
      return NextResponse.json(
        { data: null, error: { message: 'taskId is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Authenticate the client user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // Update task status (RLS ensures only permitted clients can update)
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: body.completed ? 'completed' : 'not_started',
        completed_at: body.completed ? new Date().toISOString() : null,
      })
      .eq('id', body.taskId)

    if (updateError) {
      return NextResponse.json(
        { data: null, error: { message: updateError.message, code: 'DB_ERROR' } },
        { status: 500 }
      )
    }

    // Only send notifications when marking complete
    if (!body.completed) {
      return NextResponse.json({ data: { notified: 0 }, error: null })
    }

    // Use service client for notification lookups (bypasses RLS)
    const service = createServiceClient()

    // Fetch task with project, org, and service category
    const { data: task } = await service
      .from('tasks')
      .select(`
        id, title, service_category_id,
        project:onboarding_projects(
          id, name,
          organization:organizations(id, name)
        )
      `)
      .eq('id', body.taskId)
      .single()

    if (!task?.service_category_id || !task?.project) {
      return NextResponse.json({ data: { notified: 0 }, error: null })
    }

    const project = task.project as {
      id: string
      name: string
      organization: { id: string; name: string }
    }

    // Find team members assigned to this category with notifications enabled
    const { data: assignments } = await service
      .from('category_assignments')
      .select('user:users(id, email, full_name)')
      .eq('service_category_id', task.service_category_id)
      .eq('notify_on_client_complete', true)
      .eq('organization_id', project.organization.id)

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ data: { notified: 0 }, error: null })
    }

    // Get the completing client's name
    const { data: clientProfile } = await service
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const clientName = clientProfile?.full_name ?? clientProfile?.email ?? 'A client'
    const orgName = project.organization.name
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Send notification emails
    let notified = 0
    for (const assignment of assignments) {
      const member = assignment.user as { id: string; email: string; full_name: string | null }
      if (!member?.email) continue

      try {
        await sendEmail({
          to: member.email,
          subject: `Task completed: ${task.title} — ${project.name}`,
          html: buildEmailHtml({
            agencyName: orgName,
            clientName: member.full_name ?? member.email,
            heading: 'Client task completed',
            body: `
              <p><strong>${clientName}</strong> has just completed a task in your service category:</p>
              <div style="margin:16px 0;padding:16px;background:#f8fafc;border-left:4px solid #3b82f6;border-radius:4px;">
                <p style="margin:0;font-weight:600;color:#0f172a;">${task.title}</p>
                <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Project: ${project.name}</p>
              </div>
              <p>Log in to review and take action.</p>
            `,
            ctaLabel: 'View Project',
            ctaUrl: `${appUrl}/projects/${project.id}`,
          }),
        })
        notified++
      } catch (emailErr) {
        console.error('[TaskComplete] Failed to send notification to', member.email, emailErr)
      }
    }

    return NextResponse.json({ data: { notified }, error: null })
  } catch (err) {
    console.error('[TaskComplete] Unexpected error:', err)
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
