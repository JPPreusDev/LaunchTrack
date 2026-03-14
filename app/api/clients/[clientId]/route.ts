/**
 * PATCH /api/clients/[clientId]  — update client details (org_admin only)
 * DELETE /api/clients/[clientId] — delete client (org_admin only; blocked if active projects exist)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ clientId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { clientId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const service = createServiceClient()
    const { data: profile } = await service
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'org_admin') {
      return NextResponse.json(
        { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    // Verify client belongs to this org
    const { data: existing } = await service
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { data: null, error: { message: 'Client not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const allowedFields = ['name', 'email', 'phone', 'company_name', 'website', 'notes'] as const
    type AllowedField = typeof allowedFields[number]

    const updates: Partial<Record<AllowedField, string | null>> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field] ?? null
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { data: null, error: { message: 'No valid fields to update', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const { data: client, error } = await service
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', clientId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: client, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { clientId } = await params
    const { force } = Object.fromEntries(new URL(request.url).searchParams)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const service = createServiceClient()
    const { data: profile } = await service
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'org_admin') {
      return NextResponse.json(
        { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    // Verify client belongs to this org
    const { data: existing } = await service
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { data: null, error: { message: 'Client not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Check for active projects — block unless force=true
    if (force !== 'true') {
      const { data: activeProjects } = await service
        .from('onboarding_projects')
        .select('id')
        .eq('client_id', clientId)
        .neq('status', 'completed')

      if (activeProjects && activeProjects.length > 0) {
        return NextResponse.json(
          {
            data: null,
            error: {
              message: `This client has ${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''}. Complete or delete them first, or pass force=true to delete anyway.`,
              code: 'HAS_ACTIVE_PROJECTS',
              activeProjectCount: activeProjects.length,
            },
          },
          { status: 409 }
        )
      }
    }

    const { error } = await service
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (error) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { deleted: true }, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
