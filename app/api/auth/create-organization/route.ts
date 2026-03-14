/**
 * POST /api/auth/create-organization
 * Creates the organization + admin user record after Supabase Auth signup.
 * Uses service role to bypass RLS for initial setup.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body: {
      userId: string
      email: string
      fullName: string
      agencyName: string
    } = await request.json()

    if (!body.userId || !body.email || !body.agencyName) {
      return NextResponse.json(
        { data: null, error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Create organization
    const slug = generateSlug(body.agencyName)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: body.agencyName,
        slug: slug + '-' + Date.now().toString(36),
        plan: 'starter',
        subscription_status: 'trialing',
      })
      .select('id')
      .single()

    if (orgError) {
      console.error('[Register] Failed to create org:', orgError.message)
      return NextResponse.json(
        { data: null, error: { message: 'Failed to create organization', code: 'DB_ERROR' } },
        { status: 500 }
      )
    }

    // Create user profile
    const { error: userError } = await supabase.from('users').insert({
      id: body.userId,
      organization_id: org.id,
      email: body.email,
      full_name: body.fullName,
      role: 'org_admin',
    })

    if (userError) {
      console.error('[Register] Failed to create user:', userError.message)
      return NextResponse.json(
        { data: null, error: { message: 'Failed to create user profile', code: 'DB_ERROR' } },
        { status: 500 }
      )
    }

    // Create admin membership
    await supabase.from('memberships').insert({
      organization_id: org.id,
      user_id: body.userId,
      role: 'org_admin',
      accepted_at: new Date().toISOString(),
    })

    // Seed default service categories
    const defaultCategories = [
      'Website Development',
      'Search Engine Optimization',
      'Programmatic Advertising',
      'Social Media',
      'Email Marketing',
      'Graphic Design',
      'Content Writing',
      'Print',
    ]
    await supabase.from('service_categories').insert(
      defaultCategories.map((name) => ({ organization_id: org.id, name }))
    )

    // Create default automation rules
    await supabase.from('automation_rules').insert([
      {
        organization_id: org.id,
        name: 'Asset Reminder (3 days pending)',
        trigger_type: 'asset_pending',
        trigger_config: { days_pending: 3 },
        action_type: 'send_email',
        action_config: { template: 'asset_reminder', recipient: 'client' },
      },
      {
        organization_id: org.id,
        name: 'Task Overdue Alert',
        trigger_type: 'task_overdue',
        trigger_config: { days_overdue: 1 },
        action_type: 'notify_team',
        action_config: { template: 'task_overdue' },
      },
    ])

    return NextResponse.json({ data: { organizationId: org.id }, error: null })
  } catch (err) {
    console.error('[Register] Unexpected error:', err)
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
