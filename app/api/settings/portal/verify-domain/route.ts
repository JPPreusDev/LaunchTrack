/**
 * POST /api/settings/portal/verify-domain
 * Verifies a custom domain by checking for the expected DNS TXT record.
 * Restricted to org_admin role.
 *
 * Expected TXT record:
 *   Host:  _launchtrack.{custom_domain}
 *   Value: launchtrack-verify={custom_domain_verify_token}
 */
import { NextResponse } from 'next/server'
import { promises as dns } from 'dns'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
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

  const { data: org } = await supabase
    .from('organizations')
    .select('custom_domain, custom_domain_verify_token')
    .eq('id', profile.organization_id)
    .single()

  if (!org?.custom_domain || !org?.custom_domain_verify_token) {
    return NextResponse.json(
      { data: null, error: 'No custom domain configured' },
      { status: 400 }
    )
  }

  const lookupHost = `_launchtrack.${org.custom_domain}`
  const expectedValue = `launchtrack-verify=${org.custom_domain_verify_token}`

  try {
    const records = await dns.resolveTxt(lookupHost)
    const found = records.some((record) => record.join('').includes(expectedValue))

    if (found) {
      await supabase
        .from('organizations')
        .update({ custom_domain_verified: true })
        .eq('id', profile.organization_id)

      return NextResponse.json({ data: { verified: true }, error: null })
    }

    return NextResponse.json({
      data: { verified: false },
      error: 'TXT record not found. DNS changes can take up to 48 hours to propagate.',
    })
  } catch {
    return NextResponse.json({
      data: { verified: false },
      error: 'TXT record not found. DNS changes can take up to 48 hours to propagate.',
    })
  }
}
