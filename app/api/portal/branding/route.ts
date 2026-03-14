/**
 * GET /api/portal/branding?org=[slug]
 * Public endpoint — returns org branding for the white-labeled portal login page.
 * Only exposes non-sensitive fields.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('org')
  if (!slug) {
    return NextResponse.json({ data: null, error: 'Missing org param' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: org } = await service
    .from('organizations')
    .select('name, logo_url, brand_color, portal_tagline')
    .eq('slug', slug)
    .single()

  if (!org) {
    return NextResponse.json({ data: null, error: 'Organization not found' }, { status: 404 })
  }

  return NextResponse.json({ data: org, error: null })
}
