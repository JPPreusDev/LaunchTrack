/**
 * POST /api/clients/create-account
 * Creates a Supabase auth account for a client, generates a magic-link,
 * and sends a branded welcome email. Plan-gated to growth + scale.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail, buildEmailHtml } from '@/lib/resend/client'

const PORTAL_PLANS = ['growth', 'scale']

export async function POST(request: NextRequest) {
  try {
    const { clientId }: { clientId: string } = await request.json()
    if (!clientId) {
      return NextResponse.json(
        { data: null, error: { message: 'clientId is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Authenticate calling admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const service = createServiceClient()

    // Verify caller is org_admin
    const { data: adminProfile } = await service
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'org_admin') {
      return NextResponse.json(
        { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    // Check plan is growth or scale
    const { data: org } = await service
      .from('organizations')
      .select('id, name, slug, plan, brand_color, logo_url')
      .eq('id', adminProfile.organization_id)
      .single()

    if (!org || !PORTAL_PLANS.includes(org.plan)) {
      return NextResponse.json(
        { data: null, error: { message: 'Client portal accounts require the Growth or Scale plan.', code: 'PLAN_RESTRICTED' } },
        { status: 403 }
      )
    }

    // Fetch client record
    const { data: client } = await service
      .from('clients')
      .select('id, name, email')
      .eq('id', clientId)
      .eq('organization_id', org.id)
      .single()

    if (!client) {
      return NextResponse.json(
        { data: null, error: { message: 'Client not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Check if a client_user already exists for this email
    const { data: existingUsers } = await service.auth.admin.listUsers()
    const existingAuthUser = existingUsers?.users?.find((u: { email?: string }) => u.email === client.email)

    let authUserId: string

    if (existingAuthUser) {
      authUserId = existingAuthUser.id
    } else {
      // Create the auth user
      const { data: newAuthUser, error: createError } = await service.auth.admin.createUser({
        email: client.email,
        email_confirm: true,
        user_metadata: { full_name: client.name, role: 'client_user' },
      })

      if (createError || !newAuthUser.user) {
        return NextResponse.json(
          { data: null, error: { message: createError?.message ?? 'Failed to create auth user', code: 'AUTH_ERROR' } },
          { status: 500 }
        )
      }

      authUserId = newAuthUser.user.id
    }

    // Upsert public users record
    await service.from('users').upsert({
      id: authUserId,
      organization_id: org.id,
      email: client.email,
      full_name: client.name,
      role: 'client_user',
    }, { onConflict: 'id' })

    // Generate a magic link so the client doesn't need to set a password
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const portalDashboardUrl = `${appUrl}/portal/dashboard`

    const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
      type: 'magiclink',
      email: client.email,
      options: { redirectTo: portalDashboardUrl },
    })

    if (linkError || !linkData.properties?.action_link) {
      return NextResponse.json(
        { data: null, error: { message: 'Failed to generate login link', code: 'LINK_ERROR' } },
        { status: 500 }
      )
    }

    const portalLoginUrl = `${appUrl}/portal/login?org=${org.slug}`

    // Send branded welcome email
    try {
      await sendEmail({
        to: client.email,
        subject: `You're invited to ${org.name}'s client portal`,
        html: buildEmailHtml({
          agencyName: org.name,
          clientName: client.name,
          heading: `Welcome to ${org.name}'s Portal`,
          body: `
            <p>Your account has been set up so you can track your project progress, complete tasks, and upload assets — all in one place.</p>
            <p>Click the button below to access your portal. This link is valid for 24 hours.</p>
            <p style="margin-top:16px;color:#64748b;font-size:13px;">
              After your first login, you can return anytime at:<br/>
              <a href="${portalLoginUrl}" style="color:#B91C1C;">${portalLoginUrl}</a>
            </p>
          `,
          ctaLabel: 'Access My Portal',
          ctaUrl: linkData.properties.action_link,
        }),
      })
    } catch (emailErr) {
      // Non-fatal — account was created, email failed
      console.error('[CreateAccount] Email send failed:', emailErr)
    }

    return NextResponse.json({ data: { userId: authUserId, email: client.email }, error: null })
  } catch (err) {
    console.error('[CreateAccount] Unexpected error:', err)
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'SERVER_ERROR' } },
      { status: 500 }
    )
  }
}
