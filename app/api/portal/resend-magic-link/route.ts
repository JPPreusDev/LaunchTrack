/**
 * POST /api/portal/resend-magic-link
 * Public endpoint. Sends a new magic-link to a client email for portal access.
 * Silently succeeds even if the email is not a known client_user (prevents email enumeration).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, buildEmailHtml } from '@/lib/resend/client'

export async function POST(request: NextRequest) {
  try {
    const { email, orgSlug }: { email: string; orgSlug: string | null } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { data: null, error: { message: 'Email is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const service = createServiceClient()

    // Look up the organization (needed for branding + portal URL)
    const orgFilter = orgSlug
      ? { slug: orgSlug }
      : null

    let orgData: { id: string; name: string; slug: string } | null = null

    if (orgFilter) {
      const { data } = await service
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', orgFilter.slug)
        .single()
      orgData = data
    }

    // Check if a client_user exists for this email (in the org if we have one)
    let userQuery = service
      .from('users')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase().trim())
      .eq('role', 'client_user')

    if (orgData) {
      userQuery = userQuery.eq('organization_id', orgData.id)
    }

    const { data: portalUser } = await userQuery.maybeSingle()

    // Silently succeed if no user found (prevents email enumeration)
    if (!portalUser || !orgData) {
      return NextResponse.json({ data: { sent: true }, error: null })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const portalDashboardUrl = `${appUrl}/portal/dashboard`

    const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
      type: 'magiclink',
      email: portalUser.email,
      options: { redirectTo: portalDashboardUrl },
    })

    if (linkError || !linkData.properties?.action_link) {
      // Non-fatal — silently succeed
      return NextResponse.json({ data: { sent: true }, error: null })
    }

    const portalLoginUrl = `${appUrl}/portal/login?org=${orgData.slug}`

    try {
      await sendEmail({
        to: portalUser.email,
        subject: `Your login link for ${orgData.name}'s portal`,
        html: buildEmailHtml({
          agencyName: orgData.name,
          clientName: portalUser.full_name ?? 'there',
          heading: 'Here is your login link',
          body: `
            <p>You requested a new login link for <strong>${orgData.name}</strong>&apos;s client portal.</p>
            <p>Click the button below to sign in. This link is valid for 24 hours.</p>
            <p style="margin-top:16px;color:#64748b;font-size:13px;">
              You can always return to the portal at:<br/>
              <a href="${portalLoginUrl}" style="color:#3b82f6;">${portalLoginUrl}</a>
            </p>
          `,
          ctaLabel: 'Sign in to Portal',
          ctaUrl: linkData.properties.action_link,
        }),
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ data: { sent: true }, error: null })
  } catch {
    return NextResponse.json({ data: { sent: true }, error: null })
  }
}
