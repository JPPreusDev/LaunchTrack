/**
 * PATCH /api/settings/portal
 * Updates portal branding and custom domain settings for the current user's organization.
 * Restricted to org_admin role.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'org_admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { brand_color, portal_tagline, custom_domain } = body

  const updates: Record<string, string | boolean | null> = {}

  if (brand_color !== undefined) updates.brand_color = brand_color
  if (portal_tagline !== undefined) updates.portal_tagline = portal_tagline || null

  let newVerifyToken: string | null = null

  if (custom_domain !== undefined) {
    const trimmedDomain = typeof custom_domain === 'string' ? custom_domain.trim() || null : null

    if (trimmedDomain) {
      // New or changed custom domain — generate a fresh verification token
      newVerifyToken = randomBytes(32).toString('hex')
      updates.custom_domain = trimmedDomain
      updates.custom_domain_verify_token = newVerifyToken
      updates.custom_domain_verified = false
    } else {
      // Clearing the custom domain
      updates.custom_domain = null
      updates.custom_domain_verify_token = null
      updates.custom_domain_verified = false
    }
  }

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', profile.organization_id)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: { ok: true, verify_token: newVerifyToken },
    error: null,
  })
}
